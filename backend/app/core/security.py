from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt

from app.core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS


# Băm mật khẩu bằng bcrypt trước khi lưu vào cơ sở dữ liệu.
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt)
    return hashed_password.decode()


# So sánh mật khẩu người dùng nhập với chuỗi bcrypt đã lưu.
def verify_password(plain_password: str, hash_password: str) -> bool:
    password = plain_password.encode()
    hashed_password = hash_password.encode()
    return bcrypt.checkpw(password, hashed_password)


# Tạo JWT access token có thời điểm hết hạn và thông tin định danh.
def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire_duration = expires_minutes if expires_minutes is not None else ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_duration)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Tạo JWT refresh token có thời hạn dài hơn dùng để cấp lại access token.
def create_refresh_token(data: dict, expires_days: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire_duration = expires_days if expires_days is not None else REFRESH_TOKEN_EXPIRE_DAYS
    expire = datetime.now(timezone.utc) + timedelta(days=expire_duration)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# Hàm dùng chung giải mã chuỗi JWT; chuyển lỗi thư viện thành ValueError.
def _decode_jwt(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ValueError("The token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


# Giải mã access token và đảm bảo đúng loại token.
def decode_access_token(token: str) -> Dict[str, Any]:
    payload = _decode_jwt(token)
    if payload.get("type") == "refresh":
        raise ValueError("Invalid access token")
    return payload


# Giải mã refresh token và xác thực đúng loại refresh token.
def decode_refresh_token(token: str) -> Dict[str, Any]:
    payload = _decode_jwt(token)
    if payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")
    return payload
