"""API Quản lý Công việc (Tasks).

Endpoints:
  POST   /api/tasks             – Tạo công việc mới trong dự án
  GET    /api/tasks             – Danh sách công việc (lọc theo project, assignee, status, priority, phân trang)
  GET    /api/tasks/{task_id}   – Chi tiết một công việc
  PATCH  /api/tasks/{task_id}   – Cập nhật công việc (tiêu đề, mô tả, deadline, priority, status, assignee)
  DELETE /api/tasks/{task_id}   – Xoá công việc (chỉ chủ dự án)
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.core.response import create_response, paginated_response
from app.crud.tasks import (
    create_task_service,
    delete_task_service,
    get_task_by_id_service,
    get_tasks_service,
    update_task_service,
)
from app.db.session import get_db
from app.models.users import User
from app.schemas.common import ResponseModel
from app.schemas.tasks import (
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

routers = APIRouter(prefix="/tasks", tags=["Tasks"])
router = routers  # Hỗ trợ cả 2 quy ước đặt tên router/routers


@routers.post(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo công việc mới",
    description="Tạo một công việc mới thuộc dự án. Người tạo phải là thành viên hoặc chủ dự án.",
)
def create_task(
    request: Request,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = create_task_service(db=db, data=data, current_user_id=current_user.id)
    task_data = TaskResponse.model_validate(task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_201_CREATED,
        message="Tạo công việc thành công.",
        data=task_data,
    )


@routers.get(
    "",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Danh sách công việc (tìm kiếm, phân trang, lọc)",
    description=(
        "Lấy danh sách các công việc hỗ trợ tìm kiếm, lọc theo dự án, người thực hiện, trạng thái và độ ưu tiên.\n"
        "- `project_id`: Lọc theo ID dự án.\n"
        "- `assignee_id`: Lọc theo ID người được giao.\n"
        "- `status`: Lọc trạng thái (`todo`, `in_progress`, `done`, `cancelled`).\n"
        "- `priority`: Lọc độ ưu tiên (`low`, `medium`, `high`, `urgent`).\n"
        "- `search`: Tìm kiếm theo tiêu đề hoặc mô tả công việc.\n"
        "- `page`: Trang hiện tại (mặc định 1).\n"
        "- `page_size`: Số bản ghi mỗi trang (mặc định 10)."
    ),
)
def list_tasks(
    request: Request,
    project_id: Optional[int] = Query(default=None, description="Lọc theo ID dự án"),
    assignee_id: Optional[int] = Query(default=None, description="Lọc theo ID người được giao"),
    task_status: Optional[str] = Query(default=None, alias="status", description="Trạng thái công việc: todo, in_progress, done, cancelled"),
    priority: Optional[str] = Query(default=None, description="Độ ưu tiên: low, medium, high, urgent"),
    search: Optional[str] = Query(default=None, description="Tìm theo tiêu đề hoặc mô tả"),
    page: int = Query(default=1, ge=1, description="Trang hiện tại"),
    page_size: int = Query(default=10, ge=1, le=100, description="Số lượng mỗi trang"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = get_tasks_service(
        db=db,
        project_id=project_id,
        assignee_id=assignee_id,
        task_status=task_status,
        priority=priority,
        search=search,
        page=page,
        page_size=page_size,
    )
    if total == 0 or not items:
        raise NotFoundException(message="Không tìm thấy công việc phù hợp.")

    serialized = [TaskResponse.model_validate(t).model_dump() for t in items]
    return paginated_response(
        items=serialized,
        total_records=total,
        page=page,
        page_size=page_size,
        message="Lấy danh sách công việc thành công.",
    )


@routers.get(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Chi tiết công việc",
    description="Lấy thông tin chi tiết một công việc theo ID.",
)
def get_task(
    request: Request,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task_by_id_service(db=db, task_id=task_id)
    task_data = TaskResponse.model_validate(task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Lấy thông tin công việc thành công.",
        data=task_data,
    )


@routers.patch(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật công việc",
    description="Cập nhật thông tin công việc (tiêu đề, mô tả, hạn chót, độ ưu tiên, trạng thái, người được giao).",
)
def update_task(
    request: Request,
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated_task = update_task_service(
        db=db,
        task_id=task_id,
        data=data,
        current_user_id=current_user.id,
    )
    task_data = TaskResponse.model_validate(updated_task).model_dump()
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Cập nhật công việc thành công.",
        data=task_data,
    )


@routers.delete(
    "/{task_id}",
    response_model=ResponseModel,
    status_code=status.HTTP_200_OK,
    summary="Xóa công việc",
    description="Xóa một công việc khỏi dự án. Chỉ chủ sở hữu dự án mới có quyền thực hiện.",
)
def delete_task(
    request: Request,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_task_service(db=db, task_id=task_id, current_user_id=current_user.id)
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message=f"Công việc id={task_id} đã được xóa thành công.",
    )
