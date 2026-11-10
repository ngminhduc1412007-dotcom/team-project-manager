from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.users import User
from app.schemas.auth import RegisterRequest


# Tìm người dùng theo địa chỉ email trong cơ sở dữ liệu.
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


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