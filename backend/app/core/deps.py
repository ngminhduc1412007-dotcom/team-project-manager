from typing import Callable, Optional
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.security import decode_access_token
from app.crud.project_members import get_user_project_role, is_user_in_project
from app.db.session import get_db
from app.models.projects import Project
from app.models.users import User
from app.schemas.project_members import ProjectMemberRole
from app.schemas.users import UserRole

# auto_error=False để tự trả về lỗi chuẩn 401 khi thiếu header Authorization (thay vì 403 mặc định).
bearer_scheme = HTTPBearer(auto_error=False)


# Đọc và giải mã JWT từ header Authorization; token thiếu, sai hoặc hết hạn trả 401.
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials.strip()
    ):
        raise UnauthorizedException(
            message="Thiếu token xác thực hoặc sai định dạng Bearer."
        )

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        if "expired" in str(exc).lower():
            raise UnauthorizedException(
                message="Token đã hết hạn. Vui lòng đăng nhập lại."
            )
        raise UnauthorizedException(message="Token xác thực không hợp lệ.")

    user: Optional[User] = None
    sub = payload.get("sub")
    if sub is not None:
        try:
            user = db.query(User).filter(User.id == int(sub)).first()
        except (TypeError, ValueError):
            user = None

    if user is None and payload.get("email"):
        user = db.query(User).filter(User.email == payload.get("email")).first()

    if user is None:
        raise UnauthorizedException(
            message="Không tìm thấy tài khoản tương ứng với token."
        )

    if not user.is_active:
        raise ForbiddenException(message="Tài khoản đã bị vô hiệu hóa.")

    return user


# Chỉ cho phép quản trị viên hệ thống (ADMIN) truy cập; ngược lại trả 403.
def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException(
            message="Chỉ quản trị viên hệ thống mới có quyền thực hiện thao tác này."
        )
    return current_user


# Trích xuất project_id từ path ({project_id} hoặc {id}) hoặc query của request.
def _extract_project_id(request: Request) -> int:
    raw_id = (
        request.path_params.get("project_id")
        or request.path_params.get("id")
        or request.query_params.get("project_id")
    )
    if raw_id is None:
        raise BadRequestException(message="Thiếu tham số project_id.")
    try:
        project_id = int(raw_id)
    except (TypeError, ValueError):
        raise BadRequestException(message="Tham số project_id phải là số nguyên hợp lệ.")
    if project_id <= 0:
        raise BadRequestException(message="Tham số project_id phải lớn hơn 0.")
    return project_id


# Tìm dự án theo ID; nếu không tồn tại thì trả lỗi 404.
def _get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise NotFoundException(message="Không tìm thấy dự án.")
    return project


# Chỉ thành viên dự án (hoặc chủ dự án) được truy cập; ngoài nhóm trả 403.
def require_project_member(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    project_id = _extract_project_id(request)
    project = _get_project_or_404(db, project_id)
    if not is_user_in_project(db=db, project_id=project_id, user_id=current_user.id):
        raise ForbiddenException(message="Bạn không phải thành viên của dự án này.")
    return project


# Chỉ trưởng nhóm (owner) được sửa/xóa dự án hoặc thêm/xóa thành viên; còn lại trả 403.
def require_project_leader(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Project:
    project_id = _extract_project_id(request)
    project = _get_project_or_404(db, project_id)
    role = get_user_project_role(db=db, project_id=project_id, user_id=current_user.id)
    if role != ProjectMemberRole.OWNER.value:
        raise ForbiddenException(
            message="Chỉ trưởng nhóm mới có quyền thực hiện thao tác này."
        )
    return project


# Tạo dependency kiểm tra theo danh sách vai trò cụ thể trong dự án.
def require_project_roles(*allowed_roles: ProjectMemberRole) -> Callable[..., Project]:
    allowed_values = {r.value if hasattr(r, "value") else str(r) for r in allowed_roles}

    def _dependency(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> Project:
        project_id = _extract_project_id(request)
        project = _get_project_or_404(db, project_id)
        role = get_user_project_role(db=db, project_id=project_id, user_id=current_user.id)
        if role not in allowed_values:
            raise ForbiddenException(
                message="Bạn không có quyền thực hiện thao tác này trong dự án."
            )
        return project

    return _dependency

