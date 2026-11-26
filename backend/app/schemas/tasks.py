"""
Schema cho Task — tạo, cập nhật và trả về dữ liệu.

Giá trị hợp lệ:
  Trạng thái : todo (Cần làm) | in_progress (Đang làm) | done (Hoàn thành) | cancelled (Đã huỷ)
  Độ ưu tiên : low (Thấp)    | medium (Trung bình)    | high (Cao)        | urgent (Khẩn cấp)
"""
from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ─────────────────────────── Enums ───────────────────────────────

class TaskStatus(str, Enum):
    """Trạng thái công việc."""
    TODO        = "todo"         # Cần làm
    IN_PROGRESS = "in_progress"  # Đang làm
    DONE        = "done"         # Hoàn thành
    CANCELLED   = "cancelled"    # Đã huỷ


class TaskPriority(str, Enum):
    """Độ ưu tiên công việc."""
    LOW    = "low"     # Thấp
    MEDIUM = "medium"  # Trung bình
    HIGH   = "high"    # Cao
    URGENT = "urgent"  # Khẩn cấp


# Nhãn tiếng Việt tương ứng (dùng để hiển thị cho FE)
TASK_STATUS_LABEL: dict[TaskStatus, str] = {
    TaskStatus.TODO:        "Cần làm",
    TaskStatus.IN_PROGRESS: "Đang làm",
    TaskStatus.DONE:        "Hoàn thành",
    TaskStatus.CANCELLED:   "Đã huỷ",
}

TASK_PRIORITY_LABEL: dict[TaskPriority, str] = {
    TaskPriority.LOW:    "Thấp",
    TaskPriority.MEDIUM: "Trung bình",
    TaskPriority.HIGH:   "Cao",
    TaskPriority.URGENT: "Khẩn cấp",
}


# ─────────────────────────── Schemas ─────────────────────────────

class TaskBase(BaseModel):
    """Các trường dùng chung khi tạo và cập nhật task."""
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Tiêu đề công việc",
        examples=["Thiết kế giao diện trang chủ"],
    )
    description: Optional[str] = Field(
        default=None,
        description="Mô tả chi tiết công việc",
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Hạn hoàn thành (YYYY-MM-DD)",
        examples=["2026-12-31"],
    )
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM,
        description=(
            "Độ ưu tiên: "
            "low (Thấp) | medium (Trung bình) | high (Cao) | urgent (Khẩn cấp)"
        ),
    )
    assignee_id: Optional[int] = Field(
        default=None,
        description="ID người được giao task (để trống nếu chưa giao)",
    )


class TaskCreate(TaskBase):
    """
    Payload tạo task mới.
    - project_id bắt buộc, lấy từ URL hoặc body tuỳ router.
    - status mặc định là 'todo' (Cần làm).
    """
    project_id: int = Field(..., description="ID dự án chứa task", gt=0)
    status: TaskStatus = Field(
        default=TaskStatus.TODO,
        description=(
            "Trạng thái ban đầu: "
            "todo (Cần làm) | in_progress (Đang làm) | done (Hoàn thành) | cancelled (Đã huỷ)"
        ),
    )

    @field_validator("status", mode="before")
    @classmethod
    def validate_and_normalize_status(cls, v):
        if v is None:
            return TaskStatus.TODO
        if isinstance(v, str):
            v_clean = v.strip().lower()
            valid_statuses = [e.value for e in TaskStatus]
            if v_clean not in valid_statuses:
                allowed_str = ", ".join(valid_statuses)
                raise ValueError(
                    f"Trạng thái '{v}' không hợp lệ. Các trạng thái được chấp nhận: {allowed_str}."
                )
            return TaskStatus(v_clean)
        return v


class TaskUpdate(BaseModel):
    """
    Payload cập nhật task — tất cả trường đều tùy chọn (PATCH).
    Chỉ gửi trường nào muốn thay đổi.
    """
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Tiêu đề mới",
    )
    description: Optional[str] = Field(
        default=None,
        description="Mô tả mới",
    )
    due_date: Optional[date] = Field(
        default=None,
        description="Hạn mới (YYYY-MM-DD)",
    )
    priority: Optional[TaskPriority] = Field(
        default=None,
        description="Độ ưu tiên mới: low | medium | high | urgent",
    )
    status: Optional[TaskStatus] = Field(
        default=None,
        description="Trạng thái mới: todo | in_progress | done | cancelled",
    )
    assignee_id: Optional[int] = Field(
        default=None,
        description="ID người được giao mới (null = bỏ giao)",
        ge=1,
    )

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v_clean = v.strip().lower()
            valid_statuses = [e.value for e in TaskStatus]
            if v_clean not in valid_statuses:
                allowed_str = ", ".join(valid_statuses)
                raise ValueError(
                    f"Trạng thái '{v}' không hợp lệ. Các trạng thái được chấp nhận: {allowed_str}."
                )
            return TaskStatus(v_clean)
        return v


class TaskStatusUpdate(BaseModel):
    """
    Payload chuyên dùng để đổi trạng thái công việc (hỗ trợ kéo thả trên Kanban Board).
    Tự động chuẩn hóa chữ hoa/thường, cắt khoảng trắng và kiểm tra tính hợp lệ của trạng thái.
    """
    status: TaskStatus = Field(
        ...,
        description=(
            "Trạng thái mới: "
            "todo (Cần làm) | in_progress (Đang làm) | done (Hoàn thành) | cancelled (Đã huỷ)"
        ),
        examples=["in_progress"],
    )

    @field_validator("status", mode="before")
    @classmethod
    def validate_and_normalize_status(cls, v):
        if v is None:
            raise ValueError("Trạng thái công việc không được để trống.")
        if isinstance(v, str):
            v_clean = v.strip().lower()
            valid_statuses = [e.value for e in TaskStatus]
            if v_clean not in valid_statuses:
                allowed_str = ", ".join(valid_statuses)
                raise ValueError(
                    f"Trạng thái '{v}' không hợp lệ. Các trạng thái được chấp nhận: {allowed_str}."
                )
            return TaskStatus(v_clean)
        return v


class AssigneeInfo(BaseModel):
    """Thông tin rút gọn của người được giao task."""
    id: int
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class TaskResponse(TaskBase):
    """Thông tin task trả về qua API."""
    id: int = Field(..., description="ID định danh duy nhất của task")
    project_id: int = Field(..., description="ID dự án chứa task")
    status: TaskStatus = Field(..., description="Trạng thái hiện tại")
    status_label: str = Field(default="", description="Nhãn tiếng Việt của trạng thái")
    priority_label: str = Field(default="", description="Nhãn tiếng Việt của độ ưu tiên")
    assignee: Optional[AssigneeInfo] = Field(
        default=None,
        description="Thông tin người được giao (null nếu chưa giao)",
    )
    created_at: datetime = Field(..., description="Thời gian tạo task")
    updated_at: datetime = Field(..., description="Thời gian cập nhật gần nhất")

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        instance = super().model_validate(obj, **kwargs)
        instance.status_label = TASK_STATUS_LABEL.get(instance.status, instance.status)
        instance.priority_label = TASK_PRIORITY_LABEL.get(instance.priority, instance.priority)
        return instance

