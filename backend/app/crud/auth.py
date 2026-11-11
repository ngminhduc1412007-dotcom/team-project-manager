from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

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
    return db.query(User).filter(User.email == email).first()


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
    # 1. Kiểm tra email đã tồn tại hay chưa
    existing_user = get_user_by_email(db, email=register_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được sử dụng. Vui lòng chọn email khác.",
        )

    # 2. Băm mật khẩu bảo mật bằng bcrypt
    hashed_password = hash_password(register_data.password)

    # 3. Tạo đối tượng User mới
    new_user = User(
        email=register_data.email,
        hashed_password=hashed_password,
        full_name=register_data.full_name,
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Kiểm tra trạng thái hoạt động của tài khoản
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị vô hiệu hóa.",
        )

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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ hoặc đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Kiểm tra người dùng còn tồn tại và đang hoạt động hay không
    email = payload.get("email")
    user = get_user_by_email(db, email=email) if email else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không tìm thấy người dùng tương ứng với token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị vô hiệu hóa.",
        )

    # 3. Cấp cặp token mới
    return _issue_tokens(user)



# Nghiệp vụ làm mới token: xác thực refresh_token và cấp lại access_token mới.
def refresh_token_service(db: Session, refresh_token: str) -> Dict[str, Any]:
    # 1. Giải mã và kiểm tra loại refresh_token
    try:
        payload = decode_refresh_token(refresh_token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token không hợp lệ hoặc đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Kiểm tra người dùng còn tồn tại và đang hoạt động hay không
    email = payload.get("email")
    user = get_user_by_email(db, email=email) if email else None
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Không tìm thấy người dùng tương ứng với token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã bị vô hiệu hóa.",
        )

    # 3. Cấp cặp token mới
    return _issue_tokens(user)