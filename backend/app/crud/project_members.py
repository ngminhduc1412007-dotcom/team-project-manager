from typing import Iterable, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.project_members import ProjectMember
from app.models.projects import Project
from app.schemas.project_members import ProjectMemberRole


# Tìm dự án theo ID; nếu không tồn tại thì trả về lỗi chuẩn 404.
def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message="Không tìm thấy dự án.")
    return project


# Kiểm tra người dùng có thuộc dự án hay không (là chủ dự án hoặc thành viên).
def is_user_in_project(db: Session, project_id: int, user_id: int) -> bool:
    is_owner = (
        db.query(Project.id)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if is_owner:
        return True

    is_member = (
        db.query(ProjectMember.id)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    return is_member is not None


# Lấy vai trò của người dùng trong dự án ('owner', 'admin', 'member', 'viewer' hoặc None nếu ngoài nhóm).
def get_user_project_role(db: Session, project_id: int, user_id: int) -> Optional[str]:
    is_owner = (
        db.query(Project.id)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if is_owner:
        return ProjectMemberRole.OWNER.value

    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        return None
    return member.role.value if hasattr(member.role, "value") else str(member.role)


# Kiểm tra người dùng có phải trưởng nhóm của dự án không (owner_id hoặc role='owner').
def is_project_leader(db: Session, project_id: int, user_id: int) -> bool:
    return (
        get_user_project_role(db, project_id=project_id, user_id=user_id)
        == ProjectMemberRole.OWNER.value
    )


# Xác thực dự án tồn tại và người dùng có thuộc dự án không; ngoài nhóm trả lỗi 403.
def verify_user_in_project(db: Session, project_id: int, user_id: int) -> Project:
    project = get_project_or_404(db, project_id=project_id)
    if not is_user_in_project(db, project_id=project_id, user_id=user_id):
        raise ForbiddenException(message="Bạn không phải thành viên của dự án này.")
    return project


# Xác thực dự án tồn tại và người dùng là trưởng nhóm; không phải trưởng nhóm trả lỗi 403.
def verify_project_leader(db: Session, project_id: int, user_id: int) -> Project:
    project = get_project_or_404(db, project_id=project_id)
    if not is_project_leader(db, project_id=project_id, user_id=user_id):
        raise ForbiddenException(
            message="Chỉ trưởng nhóm mới có quyền thực hiện thao tác này."
        )
    return project


# Xác thực người dùng có một trong các vai trò được phép trong dự án; không đạt trả lỗi 403.
def verify_project_roles(
    db: Session,
    project_id: int,
    user_id: int,
    allowed_roles: Iterable[ProjectMemberRole],
) -> Project:
    project = get_project_or_404(db, project_id=project_id)
    role = get_user_project_role(db, project_id=project_id, user_id=user_id)
    allowed_values = {r.value if hasattr(r, "value") else str(r) for r in allowed_roles}
    if role not in allowed_values:
        raise ForbiddenException(
            message="Bạn không có quyền thực hiện thao tác này trong dự án."
        )
    return project
