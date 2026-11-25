"""
API CRUD Task trong dự án.

Endpoints:
  POST   /api/projects/{project_id}/tasks          – Tạo công việc mới trong dự án
  GET    /api/projects/{project_id}/tasks          – Lấy danh sách công việc (phân trang, lọc, tìm kiếm)
  GET    /api/projects/{project_id}/tasks/{task_id} – Lấy thông tin chi tiết một công việc
  PATCH  /api/projects/{project_id}/tasks/{task_id} – Cập nhật công việc
  DELETE /api/projects/{project_id}/tasks/{task_id} – Xóa công việc

Xử lý lỗi:
  - 401: Chưa đăng nhập hoặc token không hợp lệ
  - 403: Không phải thành viên dự án hoặc không có quyền thao tác
  - 404: Không tìm thấy dự án hoặc công việc trong dự án
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.response import create_response, paginated_response
from app.crud.tasks import (
    create_task,
    delete_task,
    get_task_statistics,
    get_task_by_id,
    get_tasks,
    update_task,
)
from app.db.session import get_db
from app.models.users import User
from app.schemas.common import ResponseModel
from app.schemas.tasks import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["Tasks"],
)


# ──────────────────────────────── Endpoints ──────────────────────────────────

@router.post(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo công việc mới trong dự án",
    description=(
        "Tạo một công việc mới gắn vào dự án tương ứng.\n\n"
        "- Yêu cầu người dùng phải đăng nhập và là thành viên có quyền trong dự án.\n"
        "- Trả về `401` nếu chưa đăng nhập hoặc token không hợp lệ.\n"
        "- Trả về `403` nếu không thuộc dự án hoặc có vai trò người xem (viewer).\n"
        "- Trả về `404` nếu không tìm thấy dự án hoặc người được giao."
    ),
)
def create_task_endpoint(
    request: Request,
    project_id: int,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = create_task(
        db=db,
        project_id=project_id,
        data=data,
        current_user=current_user,
    )
    task_data = TaskResponse.model_validate(task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_201_CREATED,
        message="Tạo công việc thành công.",
        data=task_data,
    )


@router.get(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Danh sách công việc của dự án",
    description=(
        "Lấy danh sách các công việc thuộc dự án có hỗ trợ lọc, tìm kiếm và phân trang.\n\n"
        "- `status`: Lọc theo trạng thái (`todo`, `in_progress`, `done`, `cancelled`).\n"
        "- `priority`: Lọc theo độ ưu tiên (`low`, `medium`, `high`, `urgent`).\n"
        "- `assignee_id`: Lọc theo người thực hiện.\n"
        "- `search`: Tìm kiếm theo tiêu đề hoặc mô tả công việc.\n"
        "- `page`, `page_size`: Phân trang kết quả.\n\n"
        "- Trả về `403` nếu người dùng không phải thành viên của dự án.\n"
        "- Trả về `404` nếu dự án không tồn tại."
    ),
)
def list_tasks_endpoint(
    request: Request,
    project_id: int,
    page: int = Query(default=1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(default=10, ge=1, le=100, description="Số bản ghi mỗi trang"),
    task_status: Optional[str] = Query(
        default=None, alias="status", description="Lọc theo trạng thái"
    ),
    priority: Optional[str] = Query(default=None, description="Lọc theo độ ưu tiên"),
    assignee_id: Optional[int] = Query(default=None, description="Lọc theo ID người thực hiện"),
    search: Optional[str] = Query(default=None, description="Từ khóa tìm kiếm"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_tasks(
        db=db,
        project_id=project_id,
        current_user=current_user,
        page=page,
        page_size=page_size,
        status=task_status,
        priority=priority,
        assignee_id=assignee_id,
        search=search,
    )

    serialized = [TaskResponse.model_validate(t).model_dump() for t in items]
    return paginated_response(
        items=serialized,
        total_records=total,
        page=page,
        page_size=page_size,
        message="Lấy danh sách công việc thành công.",
    )


@router.get(
    "/statistics",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Thống kê công việc trong dự án",
    description=(
        "Trả về số công việc theo trạng thái, theo thành viên và danh sách công việc "
        "sắp đến hạn trong 7 ngày tới. Chỉ thành viên của dự án được xem."
    ),
)
def task_statistics_endpoint(
    request: Request,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statistics = get_task_statistics(
        db=db,
        project_id=project_id,
        current_user=current_user,
    )
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thống kê công việc thành công.",
        data=statistics,
    )


@router.get(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Chi tiết một công việc",
    description=(
        "Xem thông tin chi tiết của một công việc trong dự án.\n\n"
        "- Trả về `403` nếu không phải thành viên dự án.\n"
        "- Trả về `404` nếu không tìm thấy dự án hoặc công việc không tồn tại trong dự án."
    ),
)
def get_task_endpoint(
    request: Request,
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_by_id(
        db=db,
        project_id=project_id,
        task_id=task_id,
        current_user=current_user,
    )
    task_data = TaskResponse.model_validate(task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thông tin công việc thành công.",
        data=task_data,
    )


@router.patch(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật công việc (PATCH)",
    description=(
        "Cập nhật một hoặc nhiều thông tin của công việc trong dự án.\n\n"
        "- Trả về `403` nếu không thuộc dự án hoặc là người xem (viewer).\n"
        "- Trả về `404` nếu không tìm thấy dự án, công việc hoặc người thực hiện mới."
    ),
)
def update_task_endpoint(
    request: Request,
    project_id: int,
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = update_task(
        db=db,
        project_id=project_id,
        task_id=task_id,
        data=data,
        current_user=current_user,
    )
    task_data = TaskResponse.model_validate(task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật công việc thành công.",
        data=task_data,
    )


@router.delete(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Xóa công việc",
    description=(
        "Xóa vĩnh viễn một công việc thuộc dự án.\n\n"
        "- Chỉ chủ sở hữu (owner) và quản trị viên (admin) dự án mới có quyền xóa.\n"
        "- Trả về `403` nếu người dùng không đủ quyền xóa.\n"
        "- Trả về `404` nếu không tìm thấy dự án hoặc công việc."
    ),
)
def delete_task_endpoint(
    request: Request,
    project_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_task(
        db=db,
        project_id=project_id,
        task_id=task_id,
        current_user=current_user,
    )
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message=f"Công việc id={task_id} đã được xóa thành công.",
    )