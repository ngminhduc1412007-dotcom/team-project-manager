import logging
from typing import List
from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.core.response import create_response

logger = logging.getLogger("app.exceptions")


def format_validation_errors(errors: list) -> List[dict]:
    formatted = []
    for err in errors:
        loc = [str(x) for x in err.get("loc", []) if x not in ("body", "query", "path")]
        field = ".".join(loc) if loc else "general"
        formatted.append({
            "field": field,
            "message": err.get("msg", "Giá trị không hợp lệ"),
            "type": err.get("type", "value_error"),
        })
    return formatted


async def app_exception_handler(request: Request, exc: AppException):
    resp = create_response(
        request=request,
        status_code=exc.status_code,
        message=exc.message,
        errors=exc.errors,
    )
    return JSONResponse(status_code=exc.status_code, content=jsonable_encoder(resp))


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    formatted_errors = format_validation_errors(exc.errors())
    resp = create_response(
        request=request,
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Dữ liệu yêu cầu không hợp lệ (Validation Error)",
        errors=formatted_errors,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(resp),
    )


async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    resp = create_response(
        request=request,
        status_code=exc.status_code,
        message=str(exc.detail) if exc.detail else "HTTP Error",
        errors=exc.detail,
    )
    return JSONResponse(status_code=exc.status_code, content=jsonable_encoder(resp))


async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    resp = create_response(
        request=request,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
        errors=str(exc),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=jsonable_encoder(resp),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)
    app.add_exception_handler(Exception, global_exception_handler)

