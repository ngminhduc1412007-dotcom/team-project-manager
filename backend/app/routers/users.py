from fastapi import APIRouter, Depends, Request, status

from app.core.deps import get_current_user
from app.core.response import create_response
from app.models.users import User
from app.schemas.common import ResponseModel
from app.schemas.users import UserResponse

routers = APIRouter(prefix="/users", tags=["Users"])
router = routers  # Hỗ trợ cả 2 quy ước đặt tên router/routers


# API trả về thông tin tài khoản đang đăng nhập từ JWT token.
@routers.get("/me", response_model=ResponseModel, status_code=status.HTTP_200_OK)
def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    user_data = UserResponse.model_validate(current_user).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thông tin tài khoản đang đăng nhập thành công",
        data=user_data,
    )