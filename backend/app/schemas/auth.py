from pydantic import BaseModel, EmailStr, Field
from app.schemas.users import UserRole

# Schema dữ liệu nhận khi gửi yêu cầu đăng ký tài khoản.
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email người dùng")
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu chưa băm (tối thiểu 6 ký tự)")
    full_name: str = Field(..., min_length=1, max_length=100, description="Họ và tên người dùng")
    role: UserRole = Field(default=UserRole.STUDENT, description="Vai trò người dùng (STUDENT, LECTURER, ADMIN)")