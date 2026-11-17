"""Router quản lý thành viên dự án (Project Members)."""
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.core.response import create_response
from app.crud.project_members import (
    add_project_member_by_email,
    get_project_members,
)
from app.db.session import get_db
from app.models.users import User
from app.routers.projects import get_current_user
from app.schemas.common import ResponseModel
from app.schemas.project_members import (
    AddMemberByEmailRequest,
    ProjectMemberResponse,
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

