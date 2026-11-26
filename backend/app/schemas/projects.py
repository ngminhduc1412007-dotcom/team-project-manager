from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
    "active": ProjectStatus.IN_PROGRESS,
    "đang thực hiện": ProjectStatus.IN_PROGRESS,
    "dang thuc hien": ProjectStatus.IN_PROGRESS,
    "completed": ProjectStatus.COMPLETED,
    "đã hoàn thành": ProjectStatus.COMPLETED,
    "da hoan thanh": ProjectStatus.COMPLETED,
}


# ─────────────────────────── Helpers ─────────────────────────────

def _to_naive_datetime(dt: datetime) -> datetime:
    """Chuyển đổi datetime (nếu có timezone) về dạng naive để so sánh an toàn."""
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def _clean_project_name(v: object) -> str:
    """Kiểm tra và chuẩn hóa tên dự án: không rỗng, không vượt quá 200 ký tự."""
    if v is None:
        raise ValueError("Tên dự án không được để trống.")
    if not isinstance(v, str):
        raise ValueError("Tên dự án phải là chuỗi ký tự.")
    cleaned = v.strip()
    if not cleaned:
        raise ValueError("Tên dự án không được để trống.")
    if len(cleaned) > 200:
        raise ValueError("Tên dự án không được vượt quá 200 ký tự.")
    return cleaned


def _clean_description(v: Optional[str]) -> Optional[str]:
    """Chuẩn hóa mô tả dự án: loại bỏ khoảng trắng thừa, rỗng -> None."""
    if v is None:
        return None
    if not isinstance(v, str):
        raise ValueError("Mô tả dự án phải là chuỗi ký tự.")
    cleaned = v.strip()
    return cleaned if cleaned else None


def _normalize_project_status(v: object, default_on_empty: bool = False) -> object:
    """Chuẩn hóa trạng thái dự án (hỗ trợ cả tiếng Anh và tiếng Việt)."""
    if v is None or (isinstance(v, str) and not v.strip()):
        if default_on_empty:
            return ProjectStatus.PLANNING
        if v is None:
            return None
        raise ValueError(
            "Trạng thái dự án không hợp lệ. Chỉ chấp nhận: planning, in_progress, completed."
        )
    if isinstance(v, ProjectStatus):
        return v
    if isinstance(v, str):
        key = v.strip().lower()
        if key in _STATUS_NORMALIZATION_MAP:
            return _STATUS_NORMALIZATION_MAP[key]
    raise ValueError(
        "Trạng thái dự án không hợp lệ. Chỉ chấp nhận: planning, in_progress, completed."
    )


# ─────────────────────────── Schemas ─────────────────────────────

# Schema cơ sở chứa thông tin chung của dự án.
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Tên dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết dự án")
    start_date: Optional[datetime] = Field(default=None, description="Ngày bắt đầu dự án")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót hoàn thành dự án")
    status: Optional[ProjectStatus] = Field(
        default=ProjectStatus.PLANNING,
        description="Trạng thái dự án: planning (lập kế hoạch), in_progress (đang thực hiện), completed (đã hoàn thành)",
    )

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v):
        return _clean_project_name(v)

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v):
        return _clean_description(v)

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        return _normalize_project_status(v, default_on_empty=True)


# Schema nhận dữ liệu khi tạo dự án mới.
class ProjectCreate(ProjectBase):
    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectCreate":
        if self.deadline is not None:
            deadline_naive = _to_naive_datetime(self.deadline)
            if deadline_naive.date() < datetime.now().date():
                raise ValueError("Hạn chót (deadline) không được nhỏ hơn ngày hiện tại.")
            if self.start_date is not None:
                start_naive = _to_naive_datetime(self.start_date)
                if deadline_naive < start_naive:
                    raise ValueError(
                        "Hạn chót (deadline) phải lớn hơn hoặc bằng ngày bắt đầu (start_date)."
                    )
        return self


# Schema cập nhật thông tin dự án (tất cả các trường là tùy chọn).
class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Tên mới của dự án")
    description: Optional[str] = Field(default=None, description="Mô tả chi tiết mới")
    start_date: Optional[datetime] = Field(default=None, description="Ngày bắt đầu mới của dự án")
    deadline: Optional[datetime] = Field(default=None, description="Hạn chót mới của dự án")
    status: Optional[ProjectStatus] = Field(default=None, description="Trạng thái mới của dự án")

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, v):
        return _clean_project_name(v)

    @field_validator("description", mode="before")
    @classmethod
    def validate_description(cls, v):
        return _clean_description(v)

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        return _normalize_project_status(v, default_on_empty=False)

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectUpdate":
        if self.start_date is not None and self.deadline is not None:
            if _to_naive_datetime(self.deadline) < _to_naive_datetime(self.start_date):
                raise ValueError(
                    "Hạn chót (deadline) phải lớn hơn hoặc bằng ngày bắt đầu (start_date)."
                )
        return self


# Schema nhận dữ liệu khi chỉ cập nhật trạng thái dự án.
class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus = Field(
        ...,
        description="Trạng thái mới của dự án: planning, in_progress, completed",
    )

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            raise ValueError("Trạng thái dự án không được để trống.")
        return _normalize_project_status(v, default_on_empty=False)


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
