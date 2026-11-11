import bcrypt
import jwt
from app.core.config import settings
from datetime import datetime, timezone, timedelta

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Băm mật khẩu bằng bcrypt trước khi lưu vào cơ sở dữ liệu.
def hash_password(password: str):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode(), salt)
    return hashed_password.decode()

# So sánh mật khẩu người dùng nhập với chuỗi bcrypt đã lưu.
