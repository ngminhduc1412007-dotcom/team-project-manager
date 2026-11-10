import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from app.core.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES


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


# Tạo JWT có thời điểm hết hạn và các thông tin định danh cần thiết.
def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire_duration = expires_minutes if expires_minutes is not None else ACCESS_TOKEN_EXPIRE_MINUTES
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_duration)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


# Giải mã JWT; chuyển lỗi thư viện thành ValueError dễ xử lý hơn ở tầng gọi.
def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("The token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")