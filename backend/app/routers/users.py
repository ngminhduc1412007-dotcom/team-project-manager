from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.response import create_response
from app.crud.users import change_user_password, update_user_profile, upload_user_avatar
from app.db.session import get_db
from app.models.users import User
from app.schemas.common import ResponseModel
from app.schemas.users import (
    ChangePasswordRequest,
    UserProfileUpdate,
    UserResponse,
)

routers = APIRouter(prefix="/users", tags=["Users"])
router = routers  # Hỗ trợ cả 2 quy ước đặt tên router/routers


# 1. API xem thông tin cá nhân của tài khoản đang đăng nhập
@routers.get(
    "/me",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Xem thông tin cá nhân",
    description="Lấy thông tin chi tiết của người dùng đang đăng nhập dựa trên token xác thực.",
)
def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    user_data = UserResponse.model_validate(current_user).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thông tin tài khoản thành công.",
        data=user_data,
    )


# 2. API sửa thông tin cá nhân (họ tên, email, avatar, bio)
@routers.put(
    "/me",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Sửa thông tin cá nhân",
    description="Cập nhật họ tên, email, ảnh đại diện (avatar_url) hoặc mô tả bản thân (bio) cho tài khoản đang đăng nhập.",
)
@routers.patch(
    "/me",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def update_current_user_profile(
    request: Request,
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_user = update_user_profile(
        db=db,
        user_id=current_user.id,
        profile_data=data,
    )
    user_data = UserResponse.model_validate(updated_user).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật thông tin cá nhân thành công.",
        data=user_data,
    )


# 2b. API upload file ảnh đại diện (hỗ trợ cập nhật kèm họ tên, bio qua multipart/form-data)
@routers.post(
    "/me/avatar",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Upload ảnh đại diện (và cập nhật thông tin cá nhân)",
    description="Tải lên file ảnh đại diện (JPG, JPEG, PNG, GIF, WEBP tối đa 5MB). Có thể gửi kèm họ tên và mô tả bản thân.",
)
@routers.put(
    "/me/avatar",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def upload_current_user_avatar(
    request: Request,
    file: UploadFile = File(..., description="File ảnh đại diện (JPG, PNG, GIF, WEBP, tối đa 5MB)"),
    full_name: Optional[str] = Form(default=None, description="Họ và tên mới (tùy chọn)"),
    bio: Optional[str] = Form(default=None, description="Mô tả bản thân mới (tùy chọn)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_user = upload_user_avatar(
        db=db,
        user_id=current_user.id,
        file=file,
        full_name=full_name,
        bio=bio,
    )
    user_data = UserResponse.model_validate(updated_user).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật ảnh đại diện thành công.",
        data=user_data,
    )


# 3. API đổi mật khẩu (kiểm tra mật khẩu cũ)
@routers.post(
    "/change-password",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Đổi mật khẩu",
    description="Đổi mật khẩu tài khoản. Yêu cầu nhập mật khẩu hiện tại chính xác; mật khẩu mới tối thiểu 8 ký tự (gồm chữ hoa, chữ thường, số, ký tự đặc biệt) và khác mật khẩu cũ.",
)
@routers.post(
    "/me/change-password",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
@routers.put(
    "/me/change-password",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def change_password_endpoint(
    request: Request,
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    change_user_password(
        db=db,
        user_id=current_user.id,
        old_password=data.old_password,
        new_password=data.new_password,
    )
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Đổi mật khẩu thành công.",
        data=None,
    )
