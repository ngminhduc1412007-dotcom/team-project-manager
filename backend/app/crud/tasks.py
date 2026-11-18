"""Tầng nghiệp vụ (Service/CRUD) cho quản lý công việc (Tasks).

Xử lý các thao tác tạo, đọc, cập nhật, xóa task và kiểm tra ràng buộc logic.
"""
from datetime import date
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.crud.project_members import is_user_in_project
from app.models.projects import Project
from app.models.tasks import Task, TaskPriority, TaskStatus
from app.models.users import User
from app.schemas.tasks import TaskCreate, TaskStatusUpdate, TaskUpdate


# Tạo công việc mới trong dự án.
def create_task_service(
    db: Session,
    data: TaskCreate,
    current_user_id: int,
) -> Task:
    # 1. Kiểm tra dự án tồn tại
    project = db.query(Project).filter(Project.id == data.project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={data.project_id}.")

    # 2. Kiểm tra phân quyền: Người tạo phải thuộc dự án (chủ sở hữu hoặc thành viên)
    if not is_user_in_project(db=db, project_id=data.project_id, user_id=current_user_id):
        raise ForbiddenException(message="Bạn không phải thành viên của dự án này.")

    # 3. Kiểm tra người được giao (nếu có chỉ định)
    if data.assignee_id is not None:
        assignee = db.query(User).filter(User.id == data.assignee_id).first()
        if not assignee:
            raise NotFoundException(message=f"Không tìm thấy người dùng với id={data.assignee_id}.")
        if not assignee.is_active:
            raise BadRequestException(message="Tài khoản người được giao đã bị vô hiệu hóa.")
        if not is_user_in_project(db=db, project_id=data.project_id, user_id=data.assignee_id):
            raise BadRequestException(message="Người được giao việc không phải thành viên của dự án này.")

    # 4. Tạo đối tượng Task mới
    task = Task(
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        due_date=data.due_date,
        priority=data.priority,
        status=data.status,
        assignee_id=data.assignee_id,
        project_id=data.project_id,
    )
    try:
        db.add(task)
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    # Nạp kèm quan hệ assignee để trả về thông tin đầy đủ
    return (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task.id)
        .first()
    )


# Lấy danh sách công việc có phân trang, lọc và tìm kiếm.
def get_tasks_service(
    db: Session,
    project_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    task_status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date_from: Optional[date] = None,
    due_date_to: Optional[date] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Task], int]:
    query = db.query(Task).options(joinedload(Task.assignee))

    if project_id is not None:
        query = query.filter(Task.project_id == project_id)

    if assignee_id is not None:
        query = query.filter(Task.assignee_id == assignee_id)

    if task_status is not None:
        query = query.filter(Task.status == task_status.lower())

    if priority is not None:
        query = query.filter(Task.priority == priority.lower())

    # Lọc theo khoảng hạn hoàn thành (due_date)
    if due_date_from is not None:
        query = query.filter(Task.due_date >= due_date_from)

    if due_date_to is not None:
        query = query.filter(Task.due_date <= due_date_to)

    if search and search.strip():
        kw = f"%{search.strip()}%"
        query = query.filter(or_(Task.title.ilike(kw), Task.description.ilike(kw)))

    total = query.with_entities(func.count(Task.id)).scalar() or 0

    offset = (page - 1) * page_size
    items = (
        query.order_by(Task.due_date.is_(None), Task.due_date.asc(), Task.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return items, total


# Lấy thông tin chi tiết một công việc theo ID.
def get_task_by_id_service(db: Session, task_id: int) -> Task:
    task = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise NotFoundException(message=f"Không tìm thấy công việc với id={task_id}.")
    return task


# Cập nhật thông tin công việc.
def update_task_service(
    db: Session,
    task_id: int,
    data: TaskUpdate,
    current_user_id: int,
) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException(message=f"Không tìm thấy công việc với id={task_id}.")

    # Kiểm tra quyền: Phải thuộc dự án chứa task
    if not is_user_in_project(db=db, project_id=task.project_id, user_id=current_user_id):
        raise ForbiddenException(message="Bạn không có quyền chỉnh sửa công việc trong dự án này.")

    update_dict = data.model_dump(exclude_unset=True)

    # Nếu cập nhật người giao việc
    if "assignee_id" in update_dict and update_dict["assignee_id"] is not None:
        new_assignee_id = update_dict["assignee_id"]
        assignee = db.query(User).filter(User.id == new_assignee_id).first()
        if not assignee:
            raise NotFoundException(message=f"Không tìm thấy người dùng với id={new_assignee_id}.")
        if not is_user_in_project(db=db, project_id=task.project_id, user_id=new_assignee_id):
            raise BadRequestException(message="Người được giao việc không phải thành viên của dự án này.")

    for field, value in update_dict.items():
        if field == "title" and value is not None:
            value = value.strip()
        setattr(task, field, value)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task.id)
        .first()
    )


# Xóa công việc khỏi dự án.
def delete_task_service(
    db: Session,
    task_id: int,
    current_user_id: int,
) -> None:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException(message=f"Không tìm thấy công việc với id={task_id}.")

    # Chỉ chủ dự án mới có quyền xóa task
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project or project.owner_id != current_user_id:
        raise ForbiddenException(message="Chỉ chủ dự án mới có quyền xóa công việc.")

    try:
        db.delete(task)
        db.commit()
    except Exception:
        db.rollback()
        raise


# Đổi trạng thái công việc (endpoint chuyên dụng).
def update_task_status_service(
    db: Session,
    task_id: int,
    data: TaskStatusUpdate,
    current_user_id: int,
) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException(message=f"Không tìm thấy công việc với id={task_id}.")

    # Kiểm tra quyền: Phải thuộc dự án chứa task
    if not is_user_in_project(db=db, project_id=task.project_id, user_id=current_user_id):
        raise ForbiddenException(message="Bạn không có quyền thay đổi trạng thái công việc trong dự án này.")

    # Không cho phép đổi sang trạng thái hiện tại
    if task.status == data.status:
        raise BadRequestException(
            message=f"Công việc đã ở trạng thái '{data.status.value}' rồi."
        )

    task.status = data.status

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task.id)
        .first()
    )
