from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project_members import ProjectMember
from app.models.projects import Project


# Kiểm tra người dùng có thuộc dự án hay không (là chủ dự án hoặc thành viên).
def is_user_in_project(db: Session, project_id: int, user_id: int) -> bool:
    # 1. Kiểm tra nếu người dùng là chủ sở hữu dự án
    is_owner = (
        db.query(Project.id)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if is_owner:
        return True

    # 2. Kiểm tra nếu người dùng là thành viên trong bảng project_members
    is_member = (
        db.query(ProjectMember.id)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    return is_member is not None


# Lấy vai trò của người dùng trong dự án ('owner', 'admin', 'member', 'viewer' hoặc None nếu không thuộc dự án).
def get_user_project_role(db: Session, project_id: int, user_id: int) -> Optional[str]:
    is_owner = (
        db.query(Project.id)
        .filter(Project.id == project_id, Project.owner_id == user_id)
        .first()
    )
    if is_owner:
        return "owner"

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


# Xác thực dự án tồn tại và người dùng có thuộc dự án không; raise 404/403 nếu vi phạm.
def verify_user_in_project(db: Session, project_id: int, user_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy dự án.",
        )

    if not is_user_in_project(db, project_id=project_id, user_id=user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không thuộc dự án này.",
        )

    return project

