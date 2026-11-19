"""Router quản lý thành viên dự án (Project Members)."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.response import create_response
from app.crud.project_members import (
    add_project_member_by_email,
    get_project_members,
    remove_project_member,
    update_project_member_role,
)
from app.db.session import get_db
from app.models.users import User
from app.core.deps import get_current_user
from app.schemas.common import ResponseModel
from app.schemas.project_members import (
    AddMemberByEmailRequest,
    ProjectMemberResponse,
    ProjectMemberUpdate,
)

router = APIRouter(prefix="/projects", tags=["Project Members"])


@router.post(
    "/{project_id}/members",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Thêm thành viên vào dự án theo email (chỉ chủ dự án)",
)
def add_project_member(
    request: Request,
    project_id: int,
    data: AddMemberByEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    member = add_project_member_by_email(
        db=db,
        project_id=project_id,
        email=data.email,
        role=data.role,
        current_user_id=current_user.id,
    )
    member_data = ProjectMemberResponse.model_validate(member).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_201_CREATED,
        message="Thêm thành viên vào dự án thành công.",
        data=member_data,
    )


@router.get(
    "/{project_id}/members",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Danh sách thành viên của dự án",
)
def list_project_members(
    request: Request,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    members = get_project_members(db=db, project_id=project_id)
    serialized = [ProjectMemberResponse.model_validate(m).model_dump() for m in members]
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy danh sách thành viên dự án thành công.",
        data=serialized,
    )


@router.delete(
    "/{project_id}/members/{user_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Xóa thành viên khỏi dự án (chỉ chủ dự án hoặc Admin hệ thống, không cho xóa chủ dự án)",
    description=(
        "Xóa một thành viên khỏi dự án.\n"
        "- Chỉ chủ dự án hoặc Admin hệ thống mới có quyền xóa thành viên (người khác trả 403).\n"
        "- Không cho phép xóa chủ dự án (trả 400 nếu user_id là chủ dự án).\n"
        "- Dự án không tồn tại trả 404.\n"
        "- Thành viên không thuộc dự án trả 404."
    ),
)
def remove_project_member_endpoint(
    request: Request,
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = remove_project_member(
        db=db,
        project_id=project_id,
        user_id=user_id,
        current_user=current_user,
    )
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Xóa thành viên khỏi dự án thành công.",
        data=result,
    )


@router.patch(
    "/{project_id}/members/{user_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Đổi vai trò thành viên trong dự án (chỉ có thể đổi thành owner, member, viewer)",
    description=(
        "Cập nhật vai trò mới (owner, member, viewer) cho thành viên trong dự án.\n"
        "- Vai trò thành viên chỉ có thể là 'owner', 'member', hoặc 'viewer' ('admin' là quyền của admin hệ thống).\n"
        "- Khi đổi thành 'owner', quyền chủ sở hữu dự án sẽ được chuyển giao cho thành viên này.\n"
        "- Chỉ chủ dự án hoặc Admin hệ thống mới có quyền đổi vai trò (người khác trả 403).\n"
        "- Dự án hoặc thành viên không tồn tại trả 404."
    ),
)
def update_project_member_role_endpoint(
    request: Request,
    project_id: int,
    user_id: int,
    data: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_member = update_project_member_role(
        db=db,
        project_id=project_id,
        user_id=user_id,
        role=data.role,
        current_user=current_user,
    )
    member_data = ProjectMemberResponse.model_validate(updated_member).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Đổi vai trò thành viên thành công.",
        data=member_data,
    )


@router.put(
    "/{project_id}/members/{user_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def update_project_member_role_put_endpoint(
    request: Request,
    project_id: int,
    user_id: int,
    data: ProjectMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_project_member_role_endpoint(
        request=request,
        project_id=project_id,
        user_id=user_id,
        data=data,
        db=db,
        current_user=current_user,
    )

