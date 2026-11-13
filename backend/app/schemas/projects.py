from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.project_members import ProjectMemberResponse
from app.schemas.users import UserResponse


# ─────────────────────────── Enums ───────────────────────────────

class ProjectStatus(str, Enum):
    """Trạng thái của dự án."""
    PLANNING = "planning"         # Lập kế hoạch
    IN_PROGRESS = "in_progress"   # Đang thực hiện
    COMPLETED = "completed"       # Đã hoàn thành


# Nhãn tiếng Việt tương ứng cho trạng thái dự án
PROJECT_STATUS_LABEL: dict[ProjectStatus, str] = {
    ProjectStatus.PLANNING: "Lập kế hoạch",
    ProjectStatus.IN_PROGRESS: "Đang thực hiện",
    ProjectStatus.COMPLETED: "Đã hoàn thành",
}

# Mapping hỗ trợ linh hoạt cả tiếng Việt có dấu/không dấu lẫn tiếng Anh
_STATUS_NORMALIZATION_MAP = {
    "planning": ProjectStatus.PLANNING,
    "lập kế hoạch": ProjectStatus.PLANNING,
    "lap ke hoach": ProjectStatus.PLANNING,
    "in_progress": ProjectStatus.IN_PROGRESS,
    "đang thực hiện": ProjectStatus.IN_PROGRESS,
    "dang thuc hien": ProjectStatus.IN_PROGRESS,
    "completed": ProjectStatus.COMPLETED,
    "đã hoàn thành": ProjectStatus.COMPLETED,
    "da hoan thanh": ProjectStatus.COMPLETED,
}


# ─────────────────────────── Schemas ─────────────────────────────

# Schema cơ sở chứa thông tin chung của dự án.
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Tên dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết dự án")
    start_date: Optional[datetime] = Field(default=None, description="Ngày bắt đầu dự án")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót hoàn thành dự án")
    status: ProjectStatus = Field(
        default=ProjectStatus.PLANNING,
        description="Trạng thái dự án: planning (lập kế hoạch), in_progress (đang thực hiện), completed (đã hoàn thành)",
    )

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            key = v.strip().lower()
            if key in _STATUS_NORMALIZATION_MAP:
                return _STATUS_NORMALIZATION_MAP[key]
        return v


# Schema nhận dữ liệu khi tạo dự án mới.
class ProjectCreate(ProjectBase):
    pass


# Schema cập nhật thông tin dự án (tất cả các trường là tùy chọn).
class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Tên mới của dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết mới")
    start_date: Optional[datetime] = Field(default=None, description="Ngày bắt đầu mới của dự án")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót mới của dự án")
    status: Optional[ProjectStatus] = Field(default=None, description="Trạng thái mới của dự án")

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            key = v.strip().lower()
            if key in _STATUS_NORMALIZATION_MAP:
                return _STATUS_NORMALIZATION_MAP[key]
        return v


# Schema trả về thông tin dự án ra API.
class ProjectResponse(ProjectBase):
    id: int = Field(..., description="ID định danh duy nhất của dự án")
    owner_id: int = Field(..., description="ID của chủ sở hữu dự án")
    created_at: datetime = Field(..., description="Thời gian tạo dự án")
    updated_at: datetime = Field(..., description="Thời gian cập nhật dự án gần nhất")
    owner: Optional[UserResponse] = Field(default=None, description="Thông tin chi tiết chủ dự án")

    model_config = ConfigDict(from_attributes=True)


# Schema trả về chi tiết dự án kèm danh sách thành viên.
class ProjectDetailResponse(ProjectResponse):
    members: List[ProjectMemberResponse] = Field(
        default_factory=list, description="Danh sách thành viên tham gia dự án"
    )

    model_config = ConfigDict(from_attributes=True)

