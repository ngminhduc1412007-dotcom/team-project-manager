from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.response import create_response
from app.crud.auth import (
    login_user_service,
    refresh_token_service,
    register_user_service,
)
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.common import ResponseModel
from app.schemas.users import UserResponse

routers = APIRouter(prefix="/auth", tags=["Auth"])
router = routers  # Hỗ trợ cả 2 quy ước đặt tên router/routers


# API đăng ký tài khoản mới: kiểm tra dữ liệu, trùng email, băm mật khẩu.
@routers.post("/register", response_model=ResponseModel, status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    new_user = register_user_service(db=db, register_data=data)
    user_data = UserResponse.model_validate(new_user).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_201_CREATED,
        message="Đăng ký tài khoản thành công",
        data=user_data,
    )


# API đăng nhập: kiểm tra mật khẩu, cấp cặp JWT (access + refresh), trả lỗi 401 nếu sai.
@routers.post("/login", response_model=ResponseModel, status_code=status.HTTP_200_OK)
def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    auth_data = login_user_service(db=db, login_data=data)
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Đăng nhập thành công",
        data=auth_data,
    )


# API làm mới token: nhận refresh_token và cấp lại access_token + refresh_token mới.
@routers.post("/refresh", response_model=ResponseModel, status_code=status.HTTP_200_OK)
def refresh_token(
    request: Request,
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    token_data = refresh_token_service(db=db, refresh_token=data.refresh_token)
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Làm mới token thành công",
        data=token_data,
    )