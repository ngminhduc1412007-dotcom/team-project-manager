"""
API CRUD dự án (Projects).

Endpoints:
  POST   /api/projects            – Tạo dự án mới (cần đăng nhập)
  GET    /api/projects            – Lấy danh sách dự án (phân trang, lọc theo owner)
  GET    /api/projects/{id}       – Lấy chi tiết một dự án
  PATCH  /api/projects/{id}       – Cập nhật dự án (chỉ chủ dự án)
  DELETE /api/projects/{id}       – Xoá dự án (chỉ chủ dự án)

Lỗi trả về:
  401 – Chưa đăng nhập hoặc token không hợp lệ
  403 – Không phải chủ dự án
  404 – Không tìm thấy dự án với id đó
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.exceptions import UnauthorizedException
from app.core.response import create_response, paginated_response
from app.core.security import decode_access_token
from app.crud.project_members import (
    add_project_member_by_email,
    get_project_members,
)
from app.crud.projects import (
    create_project,
    delete_project,
    get_project_by_id,
    get_projects,
    update_project,
    update_project_status,
)
from app.db.session import get_db
from app.models.users import User
from app.schemas.common import ResponseModel
from app.schemas.project_members import (
    AddMemberByEmailRequest,
    ProjectMemberResponse,
)
from app.schemas.projects import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectStatusUpdate,
    ProjectUpdate,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/projects", tags=["Projects"])

_bearer = HTTPBearer(auto_error=False)


# ─────────────────────── dependency: current user ───────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    Giải mã Bearer token trong header Authorization.
    Ném 401 nếu token thiếu, hết hạn hoặc không hợp lệ.
    Ném 401 nếu người dùng không tồn tại hoặc bị vô hiệu hoá.
    """
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(message="Yêu cầu Bearer token để truy cập endpoint này.")

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise UnauthorizedException(message=f"Token không hợp lệ: {exc}.")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(message="Token không chứa thông tin người dùng.")

    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user:
        raise UnauthorizedException(message="Không tìm thấy người dùng tương ứng với token.")
    if not user.is_active:
        raise UnauthorizedException(message="Tài khoản đã bị vô hiệu hoá.")

    return user


# ─────────────────────────── endpoints ──────────────────────────────────────

@router.post(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo dự án mới",
    description="Người dùng đang đăng nhập trở thành chủ sở hữu của dự án mới.",
)
def create_project_endpoint(
    request: Request,
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = create_project(db=db, data=data, owner_id=current_user.id)
    project_data = ProjectDetailResponse.model_validate(project).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_201_CREATED,
        message="Tạo dự án thành công.",
        data=project_data,
    )


@router.get(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Danh sách dự án (tìm kiếm, phân trang, sắp xếp)",
    description=(
        "Lấy danh sách dự án có hỗ trợ tìm kiếm theo tên, phân trang và sắp xếp.\n"
        "- `name` / `search`: Tìm kiếm theo tên dự án (chứa chuỗi, không phân biệt hoa thường).\n"
        "- `page`: Trang hiện tại (>= 1, mặc định 1).\n"
        "- `page_size`: Số bản ghi mỗi trang (1-100, mặc định 10).\n"
        "- `sort_by`: Trường sắp xếp (`id`, `name`, `created_at`, `updated_at`, `deadline`; mặc định `created_at`).\n"
        "- `sort_order`: Thứ tự sắp xếp (`asc` hoặc `desc`; mặc định `desc`).\n"
        "- `owner_id`: Lọc theo ID chủ dự án.\n"
        "- `my=true`: Chỉ lấy dự án của người đang đăng nhập."
    ),
)
def list_projects_endpoint(
    request: Request,
    name: Optional[str] = Query(default=None, description="Tìm kiếm theo tên dự án"),
    search: Optional[str] = Query(default=None, description="Từ khoá tìm kiếm theo tên dự án"),
    page: int = Query(default=1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(default=10, ge=1, le=100, description="Số bản ghi mỗi trang"),
    sort_by: str = Query(
        default="created_at",
        description="Trường cần sắp xếp: id, name, created_at, updated_at, deadline",
    ),
    sort_order: str = Query(
        default="desc",
        description="Thứ tự sắp xếp: asc hoặc desc",
    ),
    owner_id: Optional[int] = Query(default=None, description="Lọc theo ID chủ dự án"),
    my: bool = Query(default=False, description="Chỉ lấy dự án của tôi"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Nếu my=true thì override owner_id bằng id người dùng hiện tại
    effective_owner_id = current_user.id if my else owner_id
    items, total = get_projects(
        db=db,
        page=page,
        page_size=page_size,
        owner_id=effective_owner_id,
        name=name,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    serialized = [ProjectDetailResponse.model_validate(p).model_dump() for p in items]
    return paginated_response(
        items=serialized,
        total_records=total,
        page=page,
        page_size=page_size,
        message="Lấy danh sách dự án thành công.",
    )


@router.get(
    "/{project_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Chi tiết một dự án",
    description="Trả về thông tin đầy đủ của dự án, kèm owner và danh sách thành viên. 404 nếu không tìm thấy.",
)
def get_project_endpoint(
    request: Request,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_by_id(db=db, project_id=project_id)
    project_data = ProjectDetailResponse.model_validate(project).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thông tin dự án thành công.",
        data=project_data,
    )


@router.patch(
    "/{project_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật dự án (chỉ chủ dự án)",
    description=(
        "Cập nhật một hoặc nhiều trường của dự án. "
        "Chỉ chủ dự án mới có quyền thực hiện; trả 403 nếu không phải chủ, 404 nếu không tìm thấy."
    ),
)
def update_project_endpoint(
    request: Request,
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = update_project(
        db=db,
        project_id=project_id,
        data=data,
        current_user=current_user,
    )
    project_data = ProjectDetailResponse.model_validate(project).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật dự án thành công.",
        data=project_data,
    )


@router.patch(
    "/{project_id}/status",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái dự án (chỉ chủ dự án và admin)",
    description=(
        "Cập nhật riêng trạng thái của dự án (planning, in_progress, completed).\n"
        "Chỉ chủ dự án (owner) và quản trị viên (admin) mới có quyền thực hiện; "
        "người khác trả 403, không tìm thấy trả 404."
    ),
)
def update_project_status_endpoint(
    request: Request,
    project_id: int,
    data: ProjectStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = update_project_status(
        db=db,
        project_id=project_id,
        new_status=data.status,
        current_user=current_user,
    )
    project_data = ProjectDetailResponse.model_validate(project).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật trạng thái dự án thành công.",
        data=project_data,
    )


@router.delete(
    "/{project_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Xoá dự án (chỉ chủ dự án)",
    description=(
        "Xoá vĩnh viễn một dự án cùng toàn bộ thành viên liên quan (cascade). "
        "Chỉ chủ dự án mới có quyền; trả 403 nếu không phải chủ, 404 nếu không tìm thấy."
    ),
)
def delete_project_endpoint(
    request: Request,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_project(db=db, project_id=project_id, current_user_id=current_user.id)
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message=f"Dự án id={project_id} đã được xoá thành công.",
    )


@router.post(
    "/{project_id}/members",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Thêm thành viên vào dự án theo email (chỉ chủ dự án)",
    description=(
        "Thêm thành viên vào dự án bằng email.\n"
        "- Chỉ chủ dự án mới có quyền thêm thành viên (người khác trả 403).\n"
        "- Chặn người dùng không tồn tại (trả 404).\n"
        "- Chặn thêm trùng nếu người dùng đã là chủ sở hữu hoặc thành viên của dự án (trả 409).\n"
        "- Dự án không tồn tại trả 404."
    ),
)
def add_project_member_endpoint(
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
    description="Lấy danh sách tất cả thành viên trong một dự án.",
)
def list_project_members_endpoint(
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

