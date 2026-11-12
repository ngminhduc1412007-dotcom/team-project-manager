from typing import List, Optional, Tuple

from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.projects import Project
from app.schemas.projects import ProjectCreate, ProjectUpdate


# ─────────────────────────── helpers ────────────────────────────

def _get_project_or_404(db: Session, project_id: int) -> Project:
    """Tìm dự án theo id; ném 404 rõ ràng nếu không có."""
    project = (
        db.query(Project)
        .options(joinedload(Project.owner), joinedload(Project.members))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise NotFoundException(
            message=f"Không tìm thấy dự án với id={project_id}."
        )
    return project


def _require_owner(project: Project, current_user_id: int) -> None:
    """Kiểm tra người dùng hiện tại có phải chủ dự án không; ném 403 nếu không."""
    if project.owner_id != current_user_id:
        raise ForbiddenException(
            message="Chỉ chủ dự án mới có quyền thực hiện thao tác này."
        )


# ─────────────────────────── CRUD ───────────────────────────────

def create_project(db: Session, data: ProjectCreate, owner_id: int) -> Project:
    """Tạo dự án mới; người dùng hiện tại trở thành chủ sở hữu."""
    project = Project(
        name=data.name,
        description=data.description,
        deadline=data.deadline,
        owner_id=owner_id,
    )
    try:
        db.add(project)
        db.commit()
        db.refresh(project)
    except Exception:
        db.rollback()
        raise

    # Tải lại kèm quan hệ để schema serialize đúng
    return _get_project_or_404(db, project.id)


def get_project_by_id(db: Session, project_id: int) -> Project:
    """Lấy chi tiết một dự án, bao gồm owner và members."""
    return _get_project_or_404(db, project_id)


def get_projects(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    owner_id: Optional[int] = None,
) -> Tuple[List[Project], int]:
    """
    Lấy danh sách dự án có phân trang.
    - owner_id: lọc theo chủ dự án (tuỳ chọn).
    Trả về (danh_sách, tổng_số_bản_ghi).
    """
    query = db.query(Project).options(
        joinedload(Project.owner), joinedload(Project.members)
    )
    if owner_id is not None:
        query = query.filter(Project.owner_id == owner_id)

    total = query.count()
    items = (
        query.order_by(Project.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def update_project(
    db: Session, project_id: int, data: ProjectUpdate, current_user_id: int
) -> Project:
    """
    Cập nhật thông tin dự án.
    - Ném 404 nếu không tìm thấy dự án.
    - Ném 403 nếu người dùng không phải chủ dự án.
    """
    project = _get_project_or_404(db, project_id)
    _require_owner(project, current_user_id)

    # Chỉ cập nhật các trường được gửi lên (exclude_unset)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    try:
        db.commit()
        db.refresh(project)
    except Exception:
        db.rollback()
        raise

    return _get_project_or_404(db, project_id)


def delete_project(db: Session, project_id: int, current_user_id: int) -> None:
    """
    Xoá dự án.
    - Ném 404 nếu không tìm thấy dự án.
    - Ném 403 nếu người dùng không phải chủ dự án.
    """
    project = _get_project_or_404(db, project_id)
    _require_owner(project, current_user_id)

    try:
        db.delete(project)
        db.commit()
    except Exception:
        db.rollback()
        raise

