from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.users import UserResponse


# Schema cơ sở chứa thông tin chung của dự án.
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Tên dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết dự án")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót hoàn thành dự án")


# Schema nhận dữ liệu khi tạo dự án mới.
class ProjectCreate(ProjectBase):
    pass


# Schema cập nhật thông tin dự án (tất cả các trường là tùy chọn).
class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Tên mới của dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết mới")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót mới của dự án")


# Schema trả về thông tin dự án ra API.
class ProjectResponse(ProjectBase):
    id: int = Field(..., description="ID định danh duy nhất của dự án")
    owner_id: int = Field(..., description="ID của chủ sở hữu dự án")
    created_at: datetime = Field(..., description="Thời gian tạo dự án")
    updated_at: datetime = Field(..., description="Thời gian cập nhật dự án gần nhất")
    owner: Optional[UserResponse] = Field(default=None, description="Thông tin chi tiết chủ dự án")

    model_config = ConfigDict(from_attributes=True)

