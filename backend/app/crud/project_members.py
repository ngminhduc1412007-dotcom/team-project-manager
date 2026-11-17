from typing import List, Optional, Union
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.models.project_members import ProjectMember
from app.models.projects import Project
from app.models.users import User
from app.schemas.project_members import ProjectMemberRole


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


# Thêm thành viên vào dự án theo Email (chỉ chủ dự án được thêm, chặn trùng, chặn user không tồn tại).
def add_project_member_by_email(
    db: Session,
    project_id: int,
    email: str,
    role: Union[ProjectMemberRole, str] = ProjectMemberRole.MEMBER,
    current_user_id: int = 0,
) -> ProjectMember:
    # 1. Kiểm tra dự án tồn tại
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")

    # 2. Phân quyền: chỉ chủ sở hữu dự án (owner) mới có quyền thêm thành viên
    if project.owner_id != current_user_id:
        raise ForbiddenException(message="Chỉ chủ dự án mới có quyền thêm thành viên.")

    # 3. Kiểm tra người dùng cần thêm có tồn tại trong hệ thống không
    normalized_email = email.strip().lower()
    target_user = db.query(User).filter(User.email == normalized_email).first()
    if not target_user:
        raise NotFoundException(message=f"Không tìm thấy người dùng với email '{email}'.")

    if not target_user.is_active:
        raise BadRequestException(message="Tài khoản người dùng này đã bị vô hiệu hóa.")

    # 4. Chặn thêm trùng: Người dùng là chủ dự án
    if target_user.id == project.owner_id:
        raise ConflictException(message="Người dùng này đã là chủ sở hữu của dự án.")

    # 5. Chặn thêm trùng: Người dùng đã là thành viên trong bảng project_members
    existing_member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == target_user.id,
        )
        .first()
    )
    if existing_member:
        raise ConflictException(message="Người dùng này đã là thành viên của dự án.")

    # 6. Thêm thành viên mới vào dự án
    member_role = (
        role
        if isinstance(role, ProjectMemberRole)
        else ProjectMemberRole(str(role).lower())
    )
    new_member = ProjectMember(
        project_id=project.id,
        user_id=target_user.id,
        role=member_role,
    )
    try:
        db.add(new_member)
        db.commit()
        db.refresh(new_member)
    except Exception:
        db.rollback()
        raise

    # Nạp kèm quan hệ user để trả về đầy đủ thông tin
    return (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.id == new_member.id)
        .first()
    )


# Lấy danh sách thành viên trong dự án.
def get_project_members(db: Session, project_id: int) -> List[ProjectMember]:
    project = db.query(Project.id).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")

    return (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
        .all()
    )

