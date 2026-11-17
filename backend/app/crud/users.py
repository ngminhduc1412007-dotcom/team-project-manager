"""Module xử lý nghiệp vụ và thao tác cơ sở dữ liệu liên quan đến người dùng (Users)."""
from typing import Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import hash_password, verify_password
from app.models.users import User
from app.schemas.users import UserProfileUpdate


# Lấy thông tin người dùng theo ID trong DB.
def get_user_by_id(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException(message=f"Không tìm thấy người dùng với id={user_id}.")
    return user


# Cập nhật thông tin cá nhân của người dùng (họ và tên, email, avatar_url, bio).
def update_user_profile(
    db: Session,
    user_id: int,
    profile_data: UserProfileUpdate,
) -> User:
    user = get_user_by_id(db, user_id)

    # 1. Cập nhật họ và tên nếu có
    if profile_data.full_name is not None:
        cleaned_name = profile_data.full_name.strip()
        if not cleaned_name:
            raise BadRequestException(message="Họ và tên không được để trống.")
        user.full_name = cleaned_name

    # 2. Cập nhật email nếu có và kiểm tra trùng lặp
    if profile_data.email is not None:
        normalized_email = profile_data.email.strip().lower()
        if normalized_email != user.email:
            existing_user = db.query(User).filter(
                User.email == normalized_email,
                User.id != user_id,
            ).first()
            if existing_user:
                raise ConflictException(message="Email này đã được sử dụng bởi một tài khoản khác.")
            user.email = normalized_email

    # 3. Cập nhật ảnh đại diện (avatar_url) nếu có
    if profile_data.avatar_url is not None:
        cleaned_avatar = profile_data.avatar_url.strip()
        user.avatar_url = cleaned_avatar if cleaned_avatar else None

    # 4. Cập nhật mô tả bản thân (bio) nếu có
    if profile_data.bio is not None:
        cleaned_bio = profile_data.bio.strip()
        user.bio = cleaned_bio if cleaned_bio else None

    # 5. Lưu thay đổi vào DB
    try:
        db.commit()
        db.refresh(user)
        return user
    except Exception:
        db.rollback()
        raise


# Đổi mật khẩu người dùng: kiểm tra mật khẩu cũ, kiểm tra ràng buộc mật khẩu mới.
def change_user_password(
    db: Session,
    user_id: int,
    old_password: str,
    new_password: str,
) -> bool:
    user = get_user_by_id(db, user_id)

    # 1. Kiểm tra mật khẩu cũ có chính xác không
    if not verify_password(old_password, user.hashed_password):
        raise BadRequestException(message="Mật khẩu hiện tại không chính xác.")

    # 2. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
    if verify_password(new_password, user.hashed_password):
        raise BadRequestException(message="Mật khẩu mới không được trùng với mật khẩu hiện tại.")

    # 3. Kiểm tra độ dài mật khẩu mới
    cleaned_new_password = new_password.strip()
    if len(cleaned_new_password) < 6:
        raise BadRequestException(message="Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.")

    # 4. Băm mật khẩu mới và cập nhật
    user.hashed_password = hash_password(cleaned_new_password)
    try:
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise

