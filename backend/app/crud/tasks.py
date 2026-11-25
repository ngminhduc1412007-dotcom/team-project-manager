"""
CRUD cho Task trong dự án.

Quản lý nghiệp vụ:
  - Tạo công việc (Create Task)
  - Xem danh sách và chi tiết công việc (Read Tasks)
  - Cập nhật công việc (Update Task)
  - Xóa công việc (Delete Task)

Xử lý quyền và ngoại lệ rõ ràng:
  - 404: Không tìm thấy dự án, công việc hoặc người dùng
  - 403: Không có quyền truy cập dự án hoặc không đủ quyền thực hiện thao tác
"""
from datetime import date, timedelta
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.crud.project_members import get_user_project_role
from app.models.project_members import ProjectMember
from app.models.projects import Project
from app.models.tasks import Task, TaskStatus
from app.models.users import User
from app.schemas.tasks import TaskCreate, TaskUpdate
from app.schemas.users import UserRole


# ─────────────────────── Helpers xác thực và phân quyền ───────────────────────

def _get_project_or_404(db: Session, project_id: int) -> Project:
    """Tìm dự án theo id; ném 404 rõ ràng nếu không tìm thấy."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")
    return project


def _get_task_or_404(db: Session, task_id: int, project_id: int) -> Task:
    """Tìm task theo id trong dự án cụ thể; ném 404 rõ ràng nếu không tìm thấy."""
    task = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.id == task_id, Task.project_id == project_id)
        .first()
    )
    if not task:
        raise NotFoundException(
            message=f"Không tìm thấy công việc với id={task_id} trong dự án này."
        )
    return task


def _check_project_membership(db: Session, project_id: int, user: User) -> Optional[str]:
    """
    Kiểm tra người dùng có thuộc dự án không.
    Trả về vai trò trong dự án ('owner', 'admin', 'member', 'viewer').
    Ném 403 nếu người dùng không thuộc dự án (ngoại trừ ADMIN hệ thống).
    """
    # Quản trị viên hệ thống (ADMIN) có quyền trên mọi dự án
    if getattr(user, "role", None) in (UserRole.ADMIN, "ADMIN"):
        return "admin"

    role = get_user_project_role(db=db, project_id=project_id, user_id=user.id)
    if not role:
        raise ForbiddenException(message="Bạn không phải thành viên của dự án này.")
    return role


def _verify_can_edit(db: Session, project_id: int, user: User) -> None:
    """
    Kiểm tra quyền tạo hoặc sửa task.
    Viewer (Người xem) không được phép tạo hoặc sửa công việc.
    """
    role = _check_project_membership(db=db, project_id=project_id, user=user)
    if role == "viewer":
        raise ForbiddenException(
            message="Thành viên với vai trò Người xem (viewer) không có quyền tạo hoặc chỉnh sửa công việc."
        )


def _verify_can_delete(db: Session, project_id: int, user: User) -> None:
    """
    Kiểm tra quyền xóa task.
    Chỉ chủ dự án (owner) hoặc quản trị viên (admin) mới có quyền xóa task.
    """
    role = _check_project_membership(db=db, project_id=project_id, user=user)
    if role not in ("owner", "admin"):
        raise ForbiddenException(
            message="Chỉ chủ dự án (owner) và quản trị viên (admin) mới có quyền xóa công việc."
        )


def _validate_assignee(
    db: Session,
    project_id: int,
    assignee_id: Optional[int],
) -> None:
    """Đảm bảo người được giao tồn tại và thuộc dự án."""
    if assignee_id is None:
        return

    assignee = db.query(User).filter(User.id == assignee_id).first()
    if not assignee:
        raise NotFoundException(
            message=f"Không tìm thấy người dùng với id={assignee_id}."
        )

    if get_user_project_role(
        db=db,
        project_id=project_id,
        user_id=assignee_id,
    ) is None:
        raise BadRequestException(
            message="Người được giao phải là thành viên của dự án."
        )


def _validate_due_date(due_date: Optional[date]) -> None:
    """Không cho phép tạo hoặc cập nhật task có hạn đã qua."""
    if due_date is not None and due_date < date.today():
        raise BadRequestException(
            message="Hạn hoàn thành không được ở trong quá khứ."
        )


# ────────────────────────────────── CRUD ─────────────────────────────────────

def create_task(
    db: Session,
    project_id: int,
    data: TaskCreate,
    current_user: User,
) -> Task:
    """
    Tạo công việc mới trong dự án.
    - 404: Không tìm thấy dự án hoặc không tìm thấy assignee.
    - 403: Người dùng không thuộc dự án hoặc là viewer.
    """
    if data.project_id is not None and data.project_id != project_id:
        raise BadRequestException(
            message="project_id trong body phải trùng với project_id trên URL."
        )

    _get_project_or_404(db, project_id)
    _verify_can_edit(db=db, project_id=project_id, user=current_user)

    _validate_due_date(data.due_date)
    _validate_assignee(
        db=db,
        project_id=project_id,
        assignee_id=data.assignee_id,
    )

    task = Task(
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        priority=data.priority,
        status=data.status,
        assignee_id=data.assignee_id,
        project_id=project_id,
    )

    try:
        db.add(task)
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return _get_task_or_404(db=db, task_id=task.id, project_id=project_id)


def get_tasks(
    db: Session,
    project_id: int,
    current_user: User,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[int] = None,
    search: Optional[str] = None,
) -> Tuple[List[Task], int]:
    """
    Lấy danh sách công việc trong dự án có hỗ trợ lọc, tìm kiếm và phân trang.
    - 404: Không tìm thấy dự án.
    - 403: Không phải thành viên dự án.
    """
    _get_project_or_404(db, project_id)
    _check_project_membership(db=db, project_id=project_id, user=current_user)

    if page < 1:
        page = 1
    if page_size < 1:
        page = 10

    query = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(Task.project_id == project_id)
    )

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if assignee_id is not None:
        query = query.filter(Task.assignee_id == assignee_id)
    if search and search.strip():
        kw = search.strip()
        query = query.filter(
            (Task.title.ilike(f"%{kw}%")) | (Task.description.ilike(f"%{kw}%"))
        )

    total = query.count()
    items = (
        query.order_by(Task.created_at.desc(), Task.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return items, total


def get_task_statistics(
    db: Session,
    project_id: int,
    current_user: User,
) -> dict:
    """Return project-scoped task statistics to project members only."""
    project = _get_project_or_404(db, project_id)
    if get_user_project_role(db, project_id, current_user.id) is None:
        raise ForbiddenException(message="Bạn không phải thành viên của dự án này.")

    tasks_by_status = {status.value: 0 for status in TaskStatus}
    for task_status, task_count in (
        db.query(Task.status, func.count(Task.id))
        .filter(Task.project_id == project_id)
        .group_by(Task.status)
        .all()
    ):
        status_value = task_status.value if hasattr(task_status, "value") else str(task_status)
        tasks_by_status[status_value] = task_count

    project_members = {
        user_id: full_name
        for user_id, full_name in (
            db.query(User.id, User.full_name)
            .join(ProjectMember, ProjectMember.user_id == User.id)
            .filter(ProjectMember.project_id == project_id)
            .all()
        )
    }
    owner = db.query(User.id, User.full_name).filter(User.id == project.owner_id).first()
    if owner:
        project_members[owner.id] = owner.full_name

    assigned_counts = dict(
        db.query(Task.assignee_id, func.count(Task.id))
        .filter(Task.project_id == project_id)
        .group_by(Task.assignee_id)
        .all()
    )
    unassigned_task_count = assigned_counts.pop(None, 0)
    tasks_by_member = [
        {
            "member_id": member_id,
            "member_name": full_name,
            "task_count": assigned_counts.get(member_id, 0),
        }
        for member_id, full_name in sorted(
            project_members.items(), key=lambda member: member[1].casefold()
        )
    ]

    today = date.today()
    due_soon_tasks = (
        db.query(Task)
        .options(joinedload(Task.assignee))
        .filter(
            Task.project_id == project_id,
            Task.due_date.between(today, today + timedelta(days=7)),
            Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED]),
        )
        .order_by(Task.due_date.asc(), Task.id.asc())
        .all()
    )
    due_soon = [
        {
            "task_id": task.id,
            "title": task.title,
            "due_date": task.due_date,
            "status": task.status,
            "priority": task.priority,
            "assignee_id": task.assignee_id,
            "assignee_name": task.assignee.full_name if task.assignee else "Chưa phân công",
        }
        for task in due_soon_tasks
    ]

    return {
        "total_tasks": sum(tasks_by_status.values()),
        "tasks_by_status": tasks_by_status,
        "tasks_by_member": tasks_by_member,
        "unassigned_task_count": unassigned_task_count,
        "due_soon_count": len(due_soon),
        "due_soon": due_soon,
    }


def get_task_by_id(
    db: Session,
    project_id: int,
    task_id: int,
    current_user: User,
) -> Task:
    """
    Xem chi tiết một công việc trong dự án.
    - 404: Không tìm thấy dự án hoặc không tìm thấy công việc trong dự án.
    - 403: Không phải thành viên dự án.
    """
    _get_project_or_404(db, project_id)
    _check_project_membership(db=db, project_id=project_id, user=current_user)
    return _get_task_or_404(db=db, task_id=task_id, project_id=project_id)


def update_task(
    db: Session,
    project_id: int,
    task_id: int,
    data: TaskUpdate,
    current_user: User,
) -> Task:
    """
    Cập nhật thông tin công việc trong dự án (PATCH).
    - 404: Không tìm thấy dự án, công việc hoặc người dùng được giao mới.
    - 403: Người dùng không thuộc dự án hoặc là viewer.
    """
    _get_project_or_404(db, project_id)
    _verify_can_edit(db=db, project_id=project_id, user=current_user)
    task = _get_task_or_404(db=db, task_id=task_id, project_id=project_id)

    update_data = data.model_dump(exclude_unset=True)

    if "due_date" in update_data:
        _validate_due_date(update_data["due_date"])
    if "assignee_id" in update_data:
        _validate_assignee(
            db=db,
            project_id=project_id,
            assignee_id=update_data["assignee_id"],
        )

    for field, value in update_data.items():
        setattr(task, field, value)

    try:
        db.commit()
        db.refresh(task)
    except Exception:
        db.rollback()
        raise

    return _get_task_or_404(db=db, task_id=task.id, project_id=project_id)


def delete_task(
    db: Session,
    project_id: int,
    task_id: int,
    current_user: User,
) -> None:
    """
    Xóa vĩnh viễn một công việc trong dự án.
    - 404: Không tìm thấy dự án hoặc công việc.
    - 403: Không có quyền xóa (chỉ owner và admin dự án mới được xóa).
    """
    _get_project_or_404(db, project_id)
    _verify_can_delete(db=db, project_id=project_id, user=current_user)
    task = _get_task_or_404(db=db, task_id=task_id, project_id=project_id)

    try:
        db.delete(task)
        db.commit()
    except Exception:
        db.rollback()
        raise