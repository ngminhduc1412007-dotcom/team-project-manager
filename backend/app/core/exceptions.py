from typing import Any, Optional
from fastapi import status


class AppException(Exception):
    """Lớp ngoại lệ cơ sở cho toàn bộ ứng dụng."""

    def __init__(
        self,
        message: str = "Đã xảy ra lỗi không xác định",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        errors: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors


class NotFoundException(AppException):
    def __init__(self, message: str = "Không tìm thấy dữ liệu yêu cầu", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_404_NOT_FOUND, errors=errors)


class BadRequestException(AppException):
    def __init__(self, message: str = "Dữ liệu yêu cầu không hợp lệ", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_400_BAD_REQUEST, errors=errors)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Yêu cầu đăng nhập hoặc phiên đã hết hạn", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_401_UNAUTHORIZED, errors=errors)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Bạn không có quyền thực hiện hành động này", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_403_FORBIDDEN, errors=errors)


class ConflictException(AppException):
    def __init__(self, message: str = "Dữ liệu đã tồn tại hoặc xảy ra xung đột", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_409_CONFLICT, errors=errors)


class InternalServerErrorException(AppException):
    def __init__(self, message: str = "Đã xảy ra lỗi máy chủ nội bộ", errors: Optional[Any] = None):
        super().__init__(message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, errors=errors)

