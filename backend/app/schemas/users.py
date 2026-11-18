from datetime import datetime
import enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# Các vai trò người dùng trong hệ thống.
class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    LECTURER = "LECTURER"
    ADMIN = "ADMIN"


# Schema cơ sở chứa các trường thông tin chung của người dùng.
class UserBase(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email người dùng")
    full_name: str = Field(..., min_length=1, max_length=100, description="Họ và tên người dùng")
    role: UserRole = Field(default=UserRole.STUDENT, description="Vai trò (STUDENT, LECTURER, ADMIN)")
    avatar_url: Optional[str] = Field(default=None, max_length=500, description="Đường dẫn / URL ảnh đại diện")
    bio: Optional[str] = Field(default=None, max_length=1000, description="Mô tả bản thân / tiểu sử")


# Schema nhận dữ liệu khi tạo/đăng ký tài khoản người dùng mới.
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu chưa băm (tối thiểu 6 ký tự)")


# Schema cập nhật thông tin người dùng (tất cả các trường đều là tùy chọn).
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = Field(default=None, max_length=255, description="Email mới")
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Họ và tên mới")
    avatar_url: Optional[str] = Field(default=None, max_length=500, description="Đường dẫn / URL ảnh đại diện mới")
    bio: Optional[str] = Field(default=None, max_length=1000, description="Mô tả bản thân mới")
    role: Optional[UserRole] = Field(default=None, description="Vai trò mới")
    is_active: Optional[bool] = Field(default=None, description="Trạng thái kích hoạt tài khoản")
    password: Optional[str] = Field(default=None, min_length=6, max_length=100, description="Mật khẩu mới nếu muốn đổi")


# Schema cập nhật thông tin cá nhân của người dùng đang đăng nhập.
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Họ và tên mới")
    email: Optional[EmailStr] = Field(default=None, max_length=255, description="Email mới")
    avatar_url: Optional[str] = Field(default=None, max_length=500, description="Đường dẫn / URL ảnh đại diện mới")
    bio: Optional[str] = Field(default=None, max_length=1000, description="Mô tả bản thân / tiểu sử mới")


# Schema đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ).
class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=1, description="Mật khẩu hiện tại cần xác thực")
    new_password: str = Field(..., min_length=6, max_length=100, description="Mật khẩu mới (tối thiểu 6 ký tự)")


# Schema trả về thông tin người dùng an toàn ra API (không chứa mật khẩu).
class UserResponse(UserBase):
    id: int = Field(..., description="ID định danh duy nhất của người dùng")
    is_active: bool = Field(default=True, description="Trạng thái tài khoản đang hoạt động hay bị khóa")
    created_at: datetime = Field(..., description="Thời gian tạo tài khoản")
    updated_at: datetime = Field(..., description="Thời gian cập nhật tài khoản gần nhất")

    model_config = ConfigDict(from_attributes=True)


# Schema đầy đủ khi lấy dữ liệu người dùng từ Database (bao gồm chuỗi mật khẩu đã hash).
class UserInDB(UserResponse):
    hashed_password: str = Field(..., description="Chuỗi băm mật khẩu bảo mật trong DB")

    model_config = ConfigDict(from_attributes=True)
