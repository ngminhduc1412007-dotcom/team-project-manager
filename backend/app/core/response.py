from datetime import datetime
import math
from typing import Any, List, Optional
from fastapi import Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from app.schemas.common import ResponseModel


# Tạo response thống nhất, đồng thời gắn thời gian và đường dẫn request như mẫu dưới
def create_response(
    request: Request,
    status_code: int,
    message: str,
    data: Any = None,
    errors: Any = None,
) -> ResponseModel:
    return ResponseModel(
        status_code=status_code,
        message=message,
        data=data,
        errors=errors,
        timestamp=datetime.now().isoformat(),
        path=request.url.path,
    )


def success_response(
    data: Optional[Any] = None,
    message: str = "Thành công",
    code: int = status.HTTP_200_OK,
    headers: Optional[dict] = None,
) -> JSONResponse:
    content = {
        "success": True,
        "code": code,
        "message": message,
        "data": jsonable_encoder(data) if data is not None else None,
    }
    return JSONResponse(status_code=code, content=content, headers=headers)


def paginated_response(
    items: List[Any],
    total_records: int,
    page: int = 1,
    page_size: int = 10,
    message: str = "Thành công",
    code: int = status.HTTP_200_OK,
    headers: Optional[dict] = None,
) -> JSONResponse:
    total_pages = math.ceil(total_records / page_size) if page_size > 0 else 0
    content = {
        "success": True,
        "code": code,
        "message": message,
        "data": {
            "items": jsonable_encoder(items),
            "meta": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        },
    }
    return JSONResponse(status_code=code, content=content, headers=headers)


def error_response(
    message: str = "Đã xảy ra lỗi",
    code: int = status.HTTP_400_BAD_REQUEST,
    errors: Optional[Any] = None,
    headers: Optional[dict] = None,
) -> JSONResponse:
    content = {
        "success": False,
        "code": code,
        "message": message,
        "data": None,
        "errors": jsonable_encoder(errors) if errors is not None else None,
    }
    return JSONResponse(status_code=code, content=content, headers=headers)
