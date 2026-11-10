from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    """Chuẩn khuôn mẫu phản hồi thống nhất cho toàn bộ hệ thống."""
    status_code: int = Field(..., description="Mã HTTP status code")
    message: str = Field(..., description="Thông điệp phản hồi")
    data: Optional[Any] = Field(default=None, description="Dữ liệu trả về")
    errors: Optional[Any] = Field(default=None, description="Chi tiết lỗi nếu có")
    timestamp: str = Field(..., description="Thời gian phản hồi dạng ISO")
    path: str = Field(..., description="Đường dẫn URL của request")


class BaseResponse(BaseModel):
    """Schema cơ sở cho mọi response API."""
    success: bool = Field(default=True, description="Trạng thái thành công")
    code: int = Field(default=200, description="Mã HTTP status code")
    message: str = Field(default="Thành công", description="Thông điệp phản hồi")


class DataResponse(BaseResponse, Generic[T]):
    """Chuẩn response bọc 1 đối tượng hoặc mảng đối tượng."""
    data: Optional[T] = Field(default=None, description="Dữ liệu trả về")


class PageMeta(BaseModel):
    """Metadata cho danh sách phân trang."""
    page: int = Field(default=1, ge=1, description="Trang hiện tại")
    page_size: int = Field(default=10, ge=1, le=100, description="Số bản ghi mỗi trang")
    total_records: int = Field(default=0, ge=0, description="Tổng số bản ghi")
    total_pages: int = Field(default=0, ge=0, description="Tổng số trang")
    has_next: bool = Field(default=False, description="Có trang tiếp theo không")
    has_prev: bool = Field(default=False, description="Có trang trước không")


class PaginatedData(BaseModel, Generic[T]):
    items: List[T] = Field(default_factory=list, description="Danh sách bản ghi trang hiện tại")
    meta: PageMeta = Field(..., description="Thông tin phân trang")


class PaginatedResponse(BaseResponse, Generic[T]):
    """Chuẩn response cho các API phân trang."""
    data: Optional[PaginatedData[T]] = Field(default=None, description="Dữ liệu phân trang")


class ErrorDetail(BaseModel):
    field: Optional[str] = Field(default=None, description="Trường dữ liệu gây lỗi")
    message: str = Field(..., description="Mô tả lỗi")
    type: Optional[str] = Field(default=None, description="Loại lỗi")


class ErrorResponse(BaseModel):
    """Chuẩn response trả về khi xảy ra lỗi."""
    success: bool = Field(default=False, description="Trạng thái thất bại")
    code: int = Field(..., description="Mã lỗi HTTP")
    message: str = Field(..., description="Thông điệp lỗi")
    errors: Optional[Any] = Field(default=None, description="Chi tiết lỗi")
    data: Optional[Any] = Field(default=None, description="Dữ liệu trả về (null khi lỗi)")

