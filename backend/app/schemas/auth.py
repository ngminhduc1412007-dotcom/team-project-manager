from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.schemas.users import UserResponse, UserRole


# Schema dữ liệu nhận khi gửi yêu cầu đăng ký tài khoản.
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email người dùng")
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu chưa băm (tối thiểu 6 ký tự)")
    full_name: str = Field(..., min_length=1, max_length=100, description="Họ và tên người dùng")
    role: UserRole = Field(default=UserRole.STUDENT, description="Vai trò người dùng (STUDENT, LECTURER, ADMIN)")


# Schema dữ liệu nhận khi gửi yêu cầu đăng nhập.
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email đăng nhập")
    password: str = Field(..., min_length=1, max_length=100, description="Mật khẩu tài khoản")


# Schema dữ liệu nhận khi yêu cầu làm mới access token bằng refresh token.
class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, description="Chuỗi refresh token hợp lệ")


# Schema dữ liệu phản hồi khi đăng nhập hoặc làm mới token thành công.
class TokenResponse(BaseModel):
    access_token: str = Field(..., description="Chuỗi JWT access token")
    refresh_token: str = Field(..., description="Chuỗi JWT refresh token")
    token_type: str = Field(default="bearer", description="Loại token xác thực")
    user: Optional[UserResponse] = Field(default=None, description="Thông tin người dùng")
