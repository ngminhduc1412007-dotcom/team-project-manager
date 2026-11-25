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
from app.schemas.users import UserRole


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


# Lấy danh sách thành viên trong dự án (chỉ thành viên thuộc dự án hoặc Admin hệ thống mới được xem).
def get_project_members(
    db: Session,
    project_id: int,
    current_user: Optional[Union[User, int]] = None,
) -> List[ProjectMember]:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")

    if current_user is not None:
        if isinstance(current_user, User):
            user = current_user
        else:
            user = db.query(User).filter(User.id == current_user).first()
        if not user:
            raise ForbiddenException(message="Không xác định được danh tính người dùng.")

        is_system_admin = getattr(user, "role", None) in (UserRole.ADMIN, "ADMIN", "admin")
        if not is_system_admin and not is_user_in_project(
            db=db, project_id=project_id, user_id=user.id
        ):
            raise ForbiddenException(
                message="Bạn không thuộc dự án này, không có quyền xem danh sách thành viên."
            )

    return (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.joined_at.asc())
        .all()
    )


def _check_project_permission(
    db: Session,
    project: Project,
    current_user: Union[User, int],
    action_desc: str = "thực hiện thao tác này",
) -> None:
    """Kiểm tra quyền: Chủ dự án hoặc Admin hệ thống mới có quyền thực hiện."""
    if isinstance(current_user, User):
        user = current_user
    else:
        user = db.query(User).filter(User.id == current_user).first()

    if not user:
        raise ForbiddenException(message="Không xác định được danh tính người dùng.")

    is_owner = (project.owner_id == user.id)
    is_system_admin = getattr(user, "role", None) in (UserRole.ADMIN, "ADMIN", "admin")

    if not (is_owner or is_system_admin):
        raise ForbiddenException(
            message=f"Chỉ chủ dự án hoặc Admin hệ thống mới có quyền {action_desc}."
        )


# Xóa thành viên khỏi dự án (chỉ chủ dự án hoặc Admin hệ thống; không được xóa chủ dự án).
def remove_project_member(
    db: Session,
    project_id: int,
    user_id: int,
    current_user: Union[User, int],
) -> dict:
    # 1. Kiểm tra dự án tồn tại
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")

    # 2. Phân quyền: chỉ chủ dự án hoặc Admin hệ thống mới có quyền xóa thành viên
    _check_project_permission(db, project, current_user, "xóa thành viên khỏi dự án")

    # 3. Không cho phép xóa chủ dự án (kể cả Admin hệ thống cũng không xóa chủ dự án)
    if user_id == project.owner_id:
        raise BadRequestException(message="Không thể xóa chủ sở hữu khỏi dự án.")

    # 4. Tìm thành viên trong dự án (hỗ trợ tìm theo user_id hoặc member.id)
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            (ProjectMember.user_id == user_id) | (ProjectMember.id == user_id),
        )
        .first()
    )
    if not member:
        raise NotFoundException(message=f"Không tìm thấy thành viên trong dự án id={project_id}.")

    # Kiểm tra thêm nếu bản ghi tìm thấy là của chủ dự án
    if member.user_id == project.owner_id or member.role == ProjectMemberRole.OWNER:
        raise BadRequestException(message="Không thể xóa chủ sở hữu khỏi dự án.")

    # 5. Nếu thành viên có task trong dự án, gỡ gán người thực hiện (assignee_id = None)
    from app.models.tasks import Task
    db.query(Task).filter(
        Task.project_id == project_id,
        Task.assignee_id == member.user_id,
    ).update({Task.assignee_id: None}, synchronize_session=False)

    # 6. Tiến hành xóa thành viên
    try:
        deleted_user_id = member.user_id
        db.delete(member)
        db.commit()
        return {"project_id": project_id, "user_id": deleted_user_id}
    except Exception:
        db.rollback()
        raise


# Đổi vai trò thành viên trong dự án: chỉ có thể đổi thành owner, member, viewer;
# admin là quyền của admin hệ thống có thể truy cập tất cả.
def update_project_member_role(
    db: Session,
    project_id: int,
    user_id: int,
    role: Union[ProjectMemberRole, str],
    current_user: Union[User, int],
) -> ProjectMember:
    # 1. Kiểm tra dự án tồn tại
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message=f"Không tìm thấy dự án với id={project_id}.")

    # 2. Phân quyền: chỉ chủ dự án hoặc Admin hệ thống mới có quyền đổi vai trò
    _check_project_permission(db, project, current_user, "thay đổi vai trò thành viên")

    # 3. Chuẩn hóa và kiểm tra vai trò: chỉ có thể là owner, member, viewer; admin là của hệ thống
    role_str = str(role.value if hasattr(role, "value") else role).strip().lower()

    if role_str == "admin":
        raise BadRequestException(
            message="Vai trò của thành viên chỉ có thể đổi thành 'owner', 'member' hoặc 'viewer'. Quyền 'admin' là vai trò quản trị viên hệ thống."
        )

    if role_str not in ("owner", "member", "viewer"):
        raise BadRequestException(
            message="Vai trò không hợp lệ. Chỉ có thể đổi thành 'owner', 'member' hoặc 'viewer'."
        )

    # 4. Kiểm tra ràng buộc đối với chủ dự án:
    # Không thể tự đổi vai trò của chủ sở hữu thành member/viewer (phải chuyển giao owner cho người khác)
    if user_id == project.owner_id and role_str != "owner":
        raise BadRequestException(
            message="Không thể đổi vai trò của chủ sở hữu thành member hoặc viewer. Vui lòng chuyển giao vai trò owner cho thành viên khác."
        )

    # 5. Tìm thành viên trong dự án
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            (ProjectMember.user_id == user_id) | (ProjectMember.id == user_id),
        )
        .first()
    )
    if not member:
        raise NotFoundException(message=f"Không tìm thấy thành viên trong dự án id={project_id}.")

    # 5. Xử lý đổi vai trò theo từng loại:
    if role_str == "owner":
        # Chuyển giao quyền chủ dự án sang cho thành viên này
        if member.user_id == project.owner_id:
            raise BadRequestException(message="Thành viên này đã là chủ sở hữu của dự án.")

        old_owner_id = project.owner_id
        project.owner_id = member.user_id
        member.role = ProjectMemberRole.OWNER

        # Cập nhật chủ dự án cũ thành member thông thường
        old_owner_member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == old_owner_id,
            )
            .first()
        )
        if old_owner_member:
            old_owner_member.role = ProjectMemberRole.MEMBER
        else:
            db.add(ProjectMember(project_id=project_id, user_id=old_owner_id, role=ProjectMemberRole.MEMBER))

    else:
        # role_str là 'member' hoặc 'viewer'
        # Không cho phép tự đổi vai trò của chủ dự án thành member/viewer (phải chuyển giao owner trước)
        if member.user_id == project.owner_id:
            raise BadRequestException(
                message="Không thể đổi vai trò của chủ sở hữu thành member hoặc viewer. Vui lòng chuyển giao vai trò owner cho thành viên khác."
            )
        member.role = ProjectMemberRole(role_str)

    try:
        db.commit()
        db.refresh(member)
    except Exception:
        db.rollback()
        raise

    return (
        db.query(ProjectMember)
        .options(joinedload(ProjectMember.user))
        .filter(ProjectMember.id == member.id)
        .first()
    )

