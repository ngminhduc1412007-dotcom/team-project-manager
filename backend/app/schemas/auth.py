from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.users import UserResponse, UserRole


def _normalize_email(v: object) -> object:
    """Chuẩn hóa email: loại bỏ khoảng trắng và chuyển về chữ thường."""
    if isinstance(v, str):
        cleaned = v.strip().lower()
        if not cleaned:
            raise ValueError("Email không được để trống.")
        return cleaned
    return v


def _validate_full_name(v: object) -> str:
    """Kiểm tra và chuẩn hóa họ tên: không rỗng, không vượt quá 100 ký tự."""
    if v is None:
        raise ValueError("Họ và tên không được để trống.")
    if not isinstance(v, str):
        raise ValueError("Họ và tên phải là chuỗi ký tự.")
    cleaned = v.strip()
    if not cleaned:
        raise ValueError("Họ và tên không được để trống.")
    if len(cleaned) > 100:
        raise ValueError("Họ và tên không được vượt quá 100 ký tự.")
    return cleaned


def _validate_password_strength(v: object, field_label: str = "Mật khẩu", min_len: int = 8) -> str:
    """Kiểm tra mật khẩu: không rỗng, không chỉ chứa khoảng trắng, đủ độ dài."""
    if v is None:
        raise ValueError(f"{field_label} không được để trống.")
    if not isinstance(v, str):
        raise ValueError(f"{field_label} phải là chuỗi ký tự.")
    if not v.strip():
        raise ValueError(f"{field_label} không được để trống hoặc chỉ chứa khoảng trắng.")
    if len(v.strip()) < min_len:
        raise ValueError(f"{field_label} phải có độ dài tối thiểu {min_len} ký tự.")
    if len(v) > 100:
        raise ValueError(f"{field_label} không được vượt quá 100 ký tự.")
    return v


# Schema dữ liệu nhận khi gửi yêu cầu đăng ký tài khoản.
class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email người dùng")
    password: str = Field(..., min_length=8, max_length=100, description="Mật khẩu chưa băm (tối thiểu 8 ký tự)")
    full_name: str = Field(..., min_length=1, max_length=100, description="Họ và tên người dùng")
    role: UserRole = Field(default=UserRole.STUDENT, description="Vai trò người dùng (STUDENT, LECTURER, ADMIN)")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        return _normalize_email(v)

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, v):
        return _validate_password_strength(v, field_label="Mật khẩu", min_len=8)

    @field_validator("full_name", mode="before")
    @classmethod
    def validate_full_name(cls, v):
        return _validate_full_name(v)

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return UserRole.STUDENT
        if isinstance(v, UserRole):
            return v
        if isinstance(v, str):
            upper = v.strip().upper()
            try:
                return UserRole(upper)
            except ValueError:
                pass
        raise ValueError("Vai trò không hợp lệ. Chỉ chấp nhận: STUDENT, LECTURER, ADMIN.")


# Schema dữ liệu nhận khi gửi yêu cầu đăng nhập.
class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255, description="Email đăng nhập")
    password: str = Field(..., min_length=1, max_length=100, description="Mật khẩu tài khoản")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        return _normalize_email(v)

    @field_validator("password", mode="before")
    @classmethod
    def validate_password(cls, v):
        return _validate_password_strength(v, field_label="Mật khẩu", min_len=1)


# Schema dữ liệu nhận khi yêu cầu làm mới access token bằng refresh token.
class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1, description="Chuỗi refresh token hợp lệ")

    @field_validator("refresh_token", mode="before")
    @classmethod
    def validate_refresh_token(cls, v):
        if v is None or not isinstance(v, str) or not v.strip():
            raise ValueError("Refresh token không được để trống.")
        return v.strip()


# Schema dữ liệu phản hồi khi đăng nhập hoặc làm mới token thành công.
class TokenResponse(BaseModel):
    access_token: str = Field(..., description="Chuỗi JWT access token")
    refresh_token: str = Field(..., description="Chuỗi JWT refresh token")
    token_type: str = Field(default="bearer", description="Loại token xác thực")
    user: Optional[UserResponse] = Field(default=None, description="Thông tin người dùng")
