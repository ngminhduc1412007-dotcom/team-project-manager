"""Tầng nghiệp vụ (Service/CRUD) cho quản lý công việc (Tasks).

Xử lý các thao tác tạo, đọc, cập nhật, xóa task và kiểm tra ràng buộc logic.
"""
from datetime import date
from typing import List, Optional, Tuple, Union
from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.crud.project_members import get_user_project_role, is_user_in_project
from app.models.projects import Project
from app.models.tasks import Task, TaskPriority, TaskStatus
from app.models.users import User
from app.schemas.project_members import ProjectMemberRole
from app.schemas.tasks import TaskCreate, TaskStatusUpdate, TaskUpdate
from app.schemas.users import UserRole


def check_task_permission(
    db: Session,
    task: Task,
    current_user: Union[User, int],
    action_desc: str = "thay đổi trạng thái công việc",
    allow_viewer: bool = False,
) -> None:
    """
    Kiểm tra phân quyền thao tác trên công việc:
    1. Quản trị viên hệ thống (Admin): Có toàn quyền với mọi công việc.
    2. Chủ sở hữu dự án (Owner): Có toàn quyền với mọi công việc trong dự án của mình.
    3. Thành viên dự án:
       - Quản trị viên dự án (Admin): Có quyền sửa/đổi trạng thái công việc.
       - Thành viên dự án (Member): Có quyền cập nhật trạng thái/tiến độ công việc khi kéo thả.
       - Người xem (Viewer): Chỉ có quyền đọc (Read-only), KHÔNG được phép thay đổi hay kéo thả.
         Nếu allow_viewer=True thì Viewer được phép (dùng cho thao tác xem).
    4. Người dùng không thuộc dự án: Bị từ chối quyền truy cập (403 Forbidden).
    """
    if isinstance(current_user, User):
        user = current_user
    else:
        user = db.query(User).filter(User.id == current_user).first()
        if not user:
            raise ForbiddenException(message="Không xác định được danh tính người dùng.")

    # 1. Admin hệ thống có toàn quyền
    if getattr(user, "role", None) in (UserRole.ADMIN, "ADMIN", "admin"):
        return

    # 2. Kiểm tra dự án chứa task
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={task.project_id}.")

    # 3. Chủ sở hữu dự án (owner)
    if project.owner_id == user.id:
        return

    # 4. Kiểm tra vai trò trong bảng project_members
    role = get_user_project_role(db=db, project_id=task.project_id, user_id=user.id)
    if not role:
        raise ForbiddenException(message="Bạn không thuộc dự án này, không có quyền thao tác với công việc.")

    role_str = str(role.value if hasattr(role, "value") else role).strip().lower()

    if role_str == ProjectMemberRole.VIEWER.value or role_str == "viewer":
        if not allow_viewer:
            raise ForbiddenException(
                message=f"Thành viên có vai trò Người xem (Viewer) không có quyền {action_desc}."
            )

    # Các vai trò hợp lệ: owner, admin, member
    return


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
# Chỉ trả về task thuộc dự án mà current_user là thành viên (hoặc Admin hệ thống xem tất cả).
def get_tasks_service(
    db: Session,
    current_user_id: int,
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
    # Kiểm tra nếu user là Admin hệ thống → xem tất cả task
    current_user = db.query(User).filter(User.id == current_user_id).first()
    is_system_admin = current_user and getattr(current_user, "role", None) in (
        UserRole.ADMIN, "ADMIN", "admin",
    )

    query = db.query(Task).options(joinedload(Task.assignee))

    # Nếu có project_id cụ thể: kiểm tra user thuộc dự án đó
    if project_id is not None:
        if not is_system_admin and not is_user_in_project(db=db, project_id=project_id, user_id=current_user_id):
            raise ForbiddenException(message="Bạn không thuộc dự án này, không có quyền xem công việc.")
        query = query.filter(Task.project_id == project_id)
    elif not is_system_admin:
        # Không truyền project_id: chỉ lấy task thuộc các dự án mà user là thành viên
        from app.models.project_members import ProjectMember
        member_project_ids = (
            db.query(ProjectMember.project_id)
            .filter(ProjectMember.user_id == current_user_id)
            .subquery()
        )
        owner_project_ids = (
            db.query(Project.id)
            .filter(Project.owner_id == current_user_id)
            .subquery()
        )
        query = query.filter(
            or_(
                Task.project_id.in_(member_project_ids),
                Task.project_id.in_(owner_project_ids),
            )
        )

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

    # Kiểm tra quyền: Phải thuộc dự án chứa task và không phải là viewer
    check_task_permission(
        db=db,
        task=task,
        current_user=current_user_id,
        action_desc="chỉnh sửa công việc",
    )

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


# Đổi trạng thái công việc (chuyên dụng cho thao tác kéo thả Kanban).
def update_task_status_service(
    db: Session,
    task_id: int,
    data: TaskStatusUpdate,
    current_user: Union[User, int],
) -> Tuple[Task, bool]:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise NotFoundException(message=f"Không tìm thấy công việc với id={task_id}.")

    # 1. Kiểm tra phân quyền người dùng (chỉ Owner, Admin, Member thuộc dự án mới được đổi trạng thái; Viewer bị từ chối)
    check_task_permission(
        db=db,
        task=task,
        current_user=current_user,
        action_desc="thay đổi trạng thái công việc",
    )

    # 2. Hỗ trợ thao tác kéo thả: Nếu thả lại đúng cột hiện tại (idempotent drag & drop), không cần ghi DB
    if task.status == data.status:
        task_with_assignee = (
            db.query(Task)
            .options(joinedload(Task.assignee))
            .filter(Task.id == task.id)
            .first()
        )
        return task_with_assignee or task, False

    # 3. Cập nhật trạng thái mới
    task.status = data.status

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    task_updated = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task.id)
        .first()
    )
    return task_updated or task, True
