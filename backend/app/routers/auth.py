from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.response import create_response
from app.crud.auth import register_user_service
from app.db.session import get_db
from app.schemas.auth import RegisterRequest
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