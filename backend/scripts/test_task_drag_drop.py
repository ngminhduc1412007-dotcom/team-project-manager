"""
Kịch bản kiểm thử toàn diện chức năng Cập nhật trạng thái Task khi kéo thả (Kanban Drag & Drop).

Bao gồm 4 nhóm kiểm thử:
1. Kiểm tra Schema Validation (Pydantic: chuẩn hóa hoa/thường, cắt khoảng trắng, bắt lỗi giá trị sai).
2. Kiểm tra Ma trận Phân quyền (System Admin, Owner, Member, Viewer, Người ngoài dự án).
3. Kiểm tra Tính năng Kéo thả Idempotent (thả cột cũ êm dịu, thả cột mới cập nhật DB).
4. Kiểm tra API Router Endpoint thực tế (đối tượng Request, ResponseModel, status_code, nhãn tiếng Việt).
"""
import sys
from pathlib import Path

# Đảm bảo đường dẫn import backend hoạt động chính xác
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.requests import Request

from app.core.exceptions import ForbiddenException, NotFoundException
from app.crud.tasks import update_task_status_service
from app.db.session import Base
from app.models.project_members import ProjectMember
from app.models.projects import Project
from app.models.tasks import Task, TaskPriority, TaskStatus
from app.models.users import User
from app.routers.tasks import update_task_status
from app.schemas.project_members import ProjectMemberRole
from app.schemas.tasks import TaskStatusUpdate
from app.schemas.users import UserRole


def run_tests():
    print("=" * 75)
    print(" BẮT ĐẦU KIỂM THỬ TÍNH NĂNG CẬP NHẬT TRẠNG THÁI TASK KHI KÉO THẢ")
    print("=" * 75)

    # =========================================================================
    # PHẦN 1: KIỂM THỬ SCHEMA VALIDATION (Pydantic)
    # =========================================================================
    print("\n[PHẦN 1] Kiểm tra tính hợp lệ của giá trị trạng thái (Schema Validation)")

    # 1.1 Trạng thái hợp lệ viết thường
    s1 = TaskStatusUpdate(status="todo")
    assert s1.status == TaskStatus.TODO
    print("  [PASS] 1.1 Chấp nhận trạng thái chuẩn 'todo'")

    s2 = TaskStatusUpdate(status="in_progress")
    assert s2.status == TaskStatus.IN_PROGRESS
    print("  [PASS] 1.2 Chấp nhận trạng thái chuẩn 'in_progress'")

    # 1.2 Chuẩn hóa chữ hoa (Kanban FE thường gửi IN_PROGRESS, DONE, TODO)
    s3 = TaskStatusUpdate(status="IN_PROGRESS")
    assert s3.status == TaskStatus.IN_PROGRESS
    print("  [PASS] 1.3 Tự động chuẩn hóa chữ hoa 'IN_PROGRESS' -> 'in_progress'")

    # 1.3 Chuẩn hóa khoảng trắng thừa
    s4 = TaskStatusUpdate(status="  done   ")
    assert s4.status == TaskStatus.DONE
    print("  [PASS] 1.4 Tự động cắt tỉa khoảng trắng '  done   ' -> 'done'")

    # 1.4 Chặn trạng thái không hợp lệ (ví dụ: 'review', 'pending', 'xyz')
    invalid_passed = False
    try:
        TaskStatusUpdate(status="review")
        invalid_passed = True
    except ValidationError as exc:
        err_msg = str(exc)
        assert "không hợp lệ" in err_msg
        print(f"  [PASS] 1.5 Chặn thành công trạng thái sai 'review' kèm thông báo lỗi rõ ràng.")

    assert not invalid_passed, "Lỗi: Không được chấp nhận trạng thái 'review'!"

    # =========================================================================
    # PHẦN 2: THIẾT LẬP DATABASE MÔ PHỎNG (SQLite In-Memory)
    # =========================================================================
    print("\n[PHẦN 2] Khởi tạo cơ sở dữ liệu mẫu trong bộ nhớ (SQLite In-Memory)")
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    SessionTesting = sessionmaker(bind=engine)
    db = SessionTesting()

    # Tạo người dùng mẫu với các vai trò khác nhau
    sys_admin = User(id=1, email="admin@hust.edu.vn", hashed_password="pwd", full_name="Admin Hệ Thống", role=UserRole.ADMIN, is_active=True)
    owner = User(id=2, email="owner@hust.edu.vn", hashed_password="pwd", full_name="Chủ Dự Án (Trưởng nhóm)", role=UserRole.STUDENT, is_active=True)
    member = User(id=3, email="member@hust.edu.vn", hashed_password="pwd", full_name="Thành Viên Dự Án", role=UserRole.STUDENT, is_active=True)
    viewer = User(id=4, email="viewer@hust.edu.vn", hashed_password="pwd", full_name="Người Xem (Chỉ đọc)", role=UserRole.STUDENT, is_active=True)
    outsider = User(id=5, email="outsider@hust.edu.vn", hashed_password="pwd", full_name="Người Ngoài Nhóm", role=UserRole.STUDENT, is_active=True)

    db.add_all([sys_admin, owner, member, viewer, outsider])
    db.commit()

    # Tạo dự án mẫu
    project = Project(id=10, name="Hệ thống Quản lý Dự án Sinh viên", owner_id=owner.id)
    db.add(project)
    db.commit()

    # Phân quyền thành viên trong dự án
    pm_member = ProjectMember(project_id=project.id, user_id=member.id, role=ProjectMemberRole.MEMBER)
    pm_viewer = ProjectMember(project_id=project.id, user_id=viewer.id, role=ProjectMemberRole.VIEWER)
    db.add_all([pm_member, pm_viewer])
    db.commit()

    # Tạo task mẫu
    task = Task(
        id=100,
        title="Phát triển chức năng kéo thả Kanban",
        project_id=project.id,
        status=TaskStatus.TODO,
        priority=TaskPriority.HIGH,
        assignee_id=member.id,
    )
    db.add(task)
    db.commit()
    print("  [PASS] Đã tạo thành công dữ liệu mẫu (1 Project, 5 Users, 2 Memberships, 1 Task)")

    # =========================================================================
    # PHẦN 3: KIỂM THỬ MA TRẬN PHÂN QUYỀN (Permission Matrix)
    # =========================================================================
    print("\n[PHẦN 3] Kiểm tra Ma trận Phân quyền & Chặn truy cập trái phép")

    # 3.1 Thành viên (Member) kéo task từ TODO sang IN_PROGRESS -> Được phép
    res_task, is_changed = update_task_status_service(
        db=db,
        task_id=task.id,
        data=TaskStatusUpdate(status="in_progress"),
        current_user=member,
    )
    assert res_task.status == TaskStatus.IN_PROGRESS
    assert is_changed is True
    print("  [PASS] 3.1 Thành viên (Member) cập nhật TODO -> IN_PROGRESS: Thành công")

    # 3.2 Chủ dự án (Owner) cập nhật IN_PROGRESS -> DONE -> Được phép
    res_task2, is_changed2 = update_task_status_service(
        db=db,
        task_id=task.id,
        data=TaskStatusUpdate(status="DONE"),
        current_user=owner,
    )
    assert res_task2.status == TaskStatus.DONE
    assert is_changed2 is True
    print("  [PASS] 3.2 Chủ dự án (Owner) cập nhật IN_PROGRESS -> DONE: Thành công")

    # 3.3 Admin hệ thống cập nhật DONE -> CANCELLED -> Được phép
    res_task3, is_changed3 = update_task_status_service(
        db=db,
        task_id=task.id,
        data=TaskStatusUpdate(status="cancelled"),
        current_user=sys_admin,
    )
    assert res_task3.status == TaskStatus.CANCELLED
    assert is_changed3 is True
    print("  [PASS] 3.3 Quản trị viên hệ thống (Admin) cập nhật DONE -> CANCELLED: Thành công")

    # 3.4 Người xem (Viewer) bị chặn tuyệt đối (403 Forbidden)
    viewer_blocked = False
    try:
        update_task_status_service(
            db=db,
            task_id=task.id,
            data=TaskStatusUpdate(status="todo"),
            current_user=viewer,
        )
    except ForbiddenException as exc:
        viewer_blocked = True
        print(f"  [PASS] 3.4 Người xem (Viewer) bị chặn chuẩn xác (403 Forbidden): '{exc.message}'")
    assert viewer_blocked, "Lỗi: Người xem (Viewer) không được phép sửa trạng thái!"

    # 3.5 Người ngoài dự án (Outsider) bị chặn (403 Forbidden)
    outsider_blocked = False
    try:
        update_task_status_service(
            db=db,
            task_id=task.id,
            data=TaskStatusUpdate(status="todo"),
            current_user=outsider,
        )
    except ForbiddenException as exc:
        outsider_blocked = True
        print(f"  [PASS] 3.5 Người ngoài nhóm bị chặn chuẩn xác (403 Forbidden): '{exc.message}'")
    assert outsider_blocked, "Lỗi: Người ngoài nhóm không được phép sửa trạng thái!"

    # 3.6 Công việc không tồn tại (404 Not Found)
    not_found_handled = False
    try:
        update_task_status_service(
            db=db,
            task_id=99999,
            data=TaskStatusUpdate(status="todo"),
            current_user=owner,
        )
    except NotFoundException as exc:
        not_found_handled = True
        print(f"  [PASS] 3.6 Truy cập task_id không tồn tại (99999): Báo lỗi 404 chuẩn xác: '{exc.message}'")
    assert not_found_handled, "Lỗi: Phải ném 404 khi không tìm thấy task!"

    # =========================================================================
    # PHẦN 4: KIỂM THỬ KÉO THẢ IDEMPOTENT & TẦNG API ROUTER (FastAPI Controller)
    # =========================================================================
    print("\n[PHẦN 4] Kiểm thử hành vi Kéo thả Idempotent & API Router Controller")

    dummy_request = Request({"type": "http", "method": "PATCH", "path": f"/api/tasks/{task.id}/status", "headers": []})

    # Đưa task về TODO
    task.status = TaskStatus.TODO
    db.commit()

    # 4.1 Gọi API kéo thả từ TODO sang IN_PROGRESS
    api_resp1 = update_task_status(
        request=dummy_request,
        task_id=task.id,
        data=TaskStatusUpdate(status="in_progress"),
        db=db,
        current_user=member,
    )
    assert api_resp1.status_code == 200
    assert api_resp1.errors is None
    assert "thành công" in api_resp1.message
    assert api_resp1.data["status"] == TaskStatus.IN_PROGRESS
    assert api_resp1.data["status_label"] == "Đang làm"
    print(f"  [PASS] 4.1 API PATCH /api/tasks/{task.id}/status -> 200 OK: '{api_resp1.message}'")

    # 4.2 Thao tác kéo thả nhả lại đúng cột cũ (IN_PROGRESS -> IN_PROGRESS)
    api_resp2 = update_task_status(
        request=dummy_request,
        task_id=task.id,
        data=TaskStatusUpdate(status="in_progress"),
        db=db,
        current_user=member,
    )
    assert api_resp2.status_code == 200
    assert api_resp2.errors is None
    assert "không thay đổi" in api_resp2.message
    print(f"  [PASS] 4.2 API Kéo thả cùng cột -> 200 OK êm dịu: '{api_resp2.message}'")

    # 4.3 Thử nghiệm Viewer gọi API Router -> Bị ném 403 Forbidden
    viewer_api_blocked = False
    try:
        update_task_status(
            request=dummy_request,
            task_id=task.id,
            data=TaskStatusUpdate(status="done"),
            db=db,
            current_user=viewer,
        )
    except ForbiddenException as exc:
        viewer_api_blocked = True
        print(f"  [PASS] 4.3 API Router chặn Viewer gọi API đổi trạng thái: '{exc.message}'")
    assert viewer_api_blocked, "Lỗi: Router không được để Viewer cập nhật task!"

    print("\n" + "=" * 75)
    print(" TỔNG KẾT: TẤT CẢ 15/15 KỊCH BẢN KIỂM THỬ ĐỀU ĐẠT CHUẨN 100%!")
    print("=" * 75)


if __name__ == "__main__":
    run_tests()
