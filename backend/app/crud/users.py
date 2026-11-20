"""Module xử lý nghiệp vụ và thao tác cơ sở dữ liệu liên quan đến người dùng (Users)."""
from pathlib import Path
from typing import Optional
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import hash_password, verify_password
from app.models.users import User
from app.schemas.users import UserProfileUpdate

# Cấu hình upload ảnh đại diện
AVATAR_UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "avatars"
AVATAR_URL_PREFIX = "/uploads/avatars/"
MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_AVATAR_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_AVATAR_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


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


def _is_valid_image_magic_bytes(content: bytes) -> bool:
    """Kiểm tra magic bytes thực tế để xác nhận file là ảnh hợp lệ (JPG/PNG/GIF/WEBP)."""
    if content.startswith(b"\xff\xd8\xff"):
        return True
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if content.startswith((b"GIF87a", b"GIF89a")):
        return True
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return True
    return False


def _remove_old_avatar_file(avatar_url: Optional[str], upload_dir: Path) -> None:
    """Xóa file ảnh đại diện cũ trên ổ đĩa nếu file nằm trong thư mục upload cục bộ."""
    if not avatar_url or not avatar_url.startswith(AVATAR_URL_PREFIX):
        return
    old_filename = Path(avatar_url).name
    old_path = upload_dir / old_filename
    if old_path.is_file():
        try:
            old_path.unlink()
        except OSError:
            pass


# Upload file ảnh đại diện cho người dùng và (tùy chọn) cập nhật kèm họ tên, bio.
def upload_user_avatar(
    db: Session,
    user_id: int,
    file: UploadFile,
    full_name: Optional[str] = None,
    bio: Optional[str] = None,
    upload_dir: Optional[Path] = None,
) -> User:
    user = get_user_by_id(db, user_id)

    if not file or not file.filename:
        raise BadRequestException(message="Vui lòng chọn file ảnh để tải lên.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        raise BadRequestException(
            message="Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG, GIF hoặc WEBP."
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_AVATAR_MIME_TYPES:
        raise BadRequestException(
            message="Loại file không hợp lệ. Chỉ chấp nhận file ảnh (image/jpeg, image/png, image/gif, image/webp)."
        )

    content = file.file.read()
    if not content:
        raise BadRequestException(message="File ảnh tải lên bị rỗng.")

    if len(content) > MAX_AVATAR_SIZE_BYTES:
        raise BadRequestException(
            message="Kích thước ảnh đại diện không được vượt quá 5MB."
        )

    if not _is_valid_image_magic_bytes(content):
        raise BadRequestException(
            message="Nội dung file không phải là ảnh hợp lệ (JPG, PNG, GIF, WEBP)."
        )

    if full_name is not None:
        cleaned_name = full_name.strip()
        if not cleaned_name:
            raise BadRequestException(message="Họ và tên không được để trống.")
        user.full_name = cleaned_name

    if bio is not None:
        cleaned_bio = bio.strip()
        user.bio = cleaned_bio if cleaned_bio else None

    target_dir = upload_dir or AVATAR_UPLOAD_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    new_filename = f"user_{user_id}_{uuid.uuid4().hex}{ext}"
    target_path = target_dir / new_filename
    target_path.write_bytes(content)

    old_avatar_url = user.avatar_url
    user.avatar_url = f"{AVATAR_URL_PREFIX}{new_filename}"

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        if target_path.is_file():
            target_path.unlink()
        raise

    _remove_old_avatar_file(old_avatar_url, target_dir)
    return user

