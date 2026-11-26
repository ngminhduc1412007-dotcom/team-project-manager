from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    UnauthorizedException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.users import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.users import UserResponse


# Tìm người dùng theo địa chỉ email trong cơ sở dữ liệu.
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized_email = email.strip().lower()
    return db.query(User).filter(User.email == normalized_email).first()


# Tạo cặp access_token và refresh_token dùng chung cho đăng nhập và làm mới token.
def _issue_tokens(user: User) -> Dict[str, str]:
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "role": role_value,
    }
    return {
        "access_token": create_access_token(data=token_data),
        "refresh_token": create_refresh_token(data=token_data),
        "token_type": "bearer",
    }


# Nghiệp vụ đăng ký: kiểm tra trùng email, băm mật khẩu và lưu người dùng mới.
def register_user_service(db: Session, register_data: RegisterRequest) -> User:
    normalized_email = register_data.email.strip().lower()

    # 1. Kiểm tra email đã tồn tại hay chưa
    existing_user = get_user_by_email(db, email=normalized_email)
    if existing_user:
        msg = "Email này đã được sử dụng. Vui lòng chọn email khác."
        raise BadRequestException(message=msg, errors=msg)

    # 2. Băm mật khẩu bảo mật bằng bcrypt
    hashed_password = hash_password(register_data.password)

    # 3. Tạo đối tượng User mới
    new_user = User(
        email=normalized_email,
        hashed_password=hashed_password,
        full_name=register_data.full_name.strip(),
        role=register_data.role,
    )

    # 4. Lưu vào cơ sở dữ liệu, rollback nếu phát sinh lỗi
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise

    return new_user


# Nghiệp vụ đăng nhập: kiểm tra tài khoản/mật khẩu, tạo cặp JWT, trả lỗi 401 nếu sai.
def login_user_service(db: Session, login_data: LoginRequest) -> Dict[str, Any]:
    # 1. Tìm người dùng theo email
    user = get_user_by_email(db, email=login_data.email)

    # 2. Kiểm tra sự tồn tại và đối chiếu mật khẩu đã hash
    if not user or not verify_password(login_data.password, user.hashed_password):
        msg = "Email hoặc mật khẩu không chính xác."
        raise UnauthorizedException(message=msg, errors=msg)

    # 3. Kiểm tra trạng thái hoạt động của tài khoản
    if not user.is_active:
        msg = "Tài khoản đã bị vô hiệu hóa."
        raise ForbiddenException(message=msg, errors=msg)

    # 4. Cấp phát JWT access_token và refresh_token
    tokens = _issue_tokens(user)
    return {
        **tokens,
        "user": UserResponse.model_validate(user).model_dump(),
    }


# Nghiệp vụ làm mới token: xác thực refresh_token và cấp lại access_token mới.
def refresh_token_service(db: Session, refresh_token: str) -> Dict[str, Any]:
    # 1. Giải mã và kiểm tra loại refresh_token
    try:
        payload = decode_refresh_token(refresh_token)
    except ValueError:
        msg = "Refresh token không hợp lệ hoặc đã hết hạn."
        raise UnauthorizedException(message=msg, errors=msg)

    # 2. Kiểm tra người dùng còn tồn tại và đang hoạt động hay không
    email = payload.get("email")
    user = get_user_by_email(db, email=email) if email else None
    if not user:
        msg = "Không tìm thấy người dùng tương ứng với token."
        raise UnauthorizedException(message=msg, errors=msg)

    if not user.is_active:
        msg = "Tài khoản đã bị vô hiệu hóa."
        raise ForbiddenException(message=msg, errors=msg)

    # 3. Cấp cặp token mới
    return _issue_tokens(user)