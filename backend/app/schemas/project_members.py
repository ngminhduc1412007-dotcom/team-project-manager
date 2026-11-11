from datetime import datetime
import enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.users import UserResponse


# Các vai trò của thành viên trong một dự án (khớp ENUM trong sql/init.sql).
class ProjectMemberRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


# Schema cơ sở chứa thông tin chung của thành viên dự án.
class ProjectMemberBase(BaseModel):
    user_id: int = Field(..., gt=0, description="ID của người dùng")
    role: ProjectMemberRole = Field(
        default=ProjectMemberRole.MEMBER,
        description="Vai trò trong dự án (owner, admin, member, viewer)",
    )


# Schema nhận dữ liệu khi thêm thành viên mới vào dự án.
class ProjectMemberCreate(ProjectMemberBase):
    pass


# Schema nhận dữ liệu khi cập nhật vai trò của thành viên trong dự án.
class ProjectMemberUpdate(BaseModel):
    role: ProjectMemberRole = Field(
        ..., description="Vai trò mới trong dự án (owner, admin, member, viewer)"
    )


# Schema trả về thông tin thành viên dự án ra API (kèm thông tin User nếu có).
class ProjectMemberResponse(BaseModel):
    id: int = Field(..., description="ID định danh bản ghi thành viên")
    project_id: int = Field(..., description="ID dự án")
    user_id: int = Field(..., description="ID người dùng")
    role: ProjectMemberRole = Field(..., description="Vai trò trong dự án")
    joined_at: datetime = Field(..., description="Thời gian tham gia dự án")
    user: Optional[UserResponse] = Field(default=None, description="Thông tin chi tiết người dùng")

    model_config = ConfigDict(from_attributes=True)

