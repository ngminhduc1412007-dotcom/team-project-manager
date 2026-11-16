"""Script thêm tài khoản mẫu (nhóm trưởng, thành viên) và kiểm tra toàn diện
các ràng buộc duy nhất (Unique Constraint) cùng các khóa ngoại liên quan (Foreign Keys).

Chạy trực tiếp:
    python backend/scripts/seed_and_verify_accounts.py
"""
import os
import sys
from datetime import datetime, date, timedelta
from pathlib import Path

# Đảm bảo import được module app
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import engine, SessionLocal
from app.models.users import User, UserRole
from app.models.projects import Project
from app.models.project_members import ProjectMember, ProjectMemberRole
from app.models.tasks import Task, TaskPriority, TaskStatus


# Dữ liệu tài khoản mẫu cần nạp
SAMPLE_ACCOUNTS = [
    {
        "email": "truongnhom1@example.com",
        "full_name": "Nguyễn Văn Trưởng (Leader 1)",
        "role": UserRole.STUDENT,
        "password": "password123",
        "title": "Nhóm trưởng Đồ án CNTT",
    },
    {
        "email": "truongnhom2@example.com",
        "full_name": "Trần Thị Minh Tâm (Leader 2)",
        "role": UserRole.STUDENT,
        "password": "password123",
        "title": "Nhóm trưởng Đồ án AI",
    },
    {
        "email": "thanhvien1@example.com",
        "full_name": "Lê Văn Hoàng (Member 1)",
        "role": UserRole.STUDENT,
        "password": "password123",
        "title": "Thành viên phát triển Frontend",
    },
    {
        "email": "thanhvien2@example.com",
        "full_name": "Phạm Quỳnh Chi (Member 2)",
        "role": UserRole.STUDENT,
        "password": "password123",
        "title": "Thành viên phát triển Backend",
    },
    {
        "email": "thanhvien3@example.com",
        "full_name": "Đặng Quốc Duy (Member 3)",
        "role": UserRole.STUDENT,
        "password": "password123",
        "title": "Thành viên Tester & QA",
    },
    {
        "email": "giangvien.hd@example.com",
        "full_name": "TS. Vũ Hoàng Anh",
        "role": UserRole.LECTURER,
        "password": "password123",
        "title": "Giảng viên hướng dẫn",
    },
]


def seed_sample_accounts(db: Session) -> dict[str, User]:
    """Nạp tài khoản mẫu vào cơ sở dữ liệu nếu chưa tồn tại."""
    print("\n" + "=" * 70)
    print(" 1. TIẾN HÀNH THÊM TÀI KHOẢN MẪU (NHÓM TRƯỞNG & THÀNH VIÊN)")
    print("=" * 70)
    
    cached_users = {}
    hashed_pwd = hash_password("password123")
    
    for item in SAMPLE_ACCOUNTS:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if existing:
            print(f" [+] Tài khoản đã tồn tại: {item['email']} ({item['full_name']}) - Role: {existing.role.value}")
            cached_users[item["email"]] = existing
        else:
            new_user = User(
                email=item["email"],
                full_name=item["full_name"],
                hashed_password=hashed_pwd,
                role=item["role"],
                is_active=True,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f" [V] Đã tạo thành công: {new_user.email} (ID: {new_user.id}) | {item['title']}")
            cached_users[item["email"]] = new_user
            
    return cached_users


def run_constraint_verifications(db: Session, users: dict[str, User]) -> list[dict]:
    """Kiểm tra toàn bộ các ràng buộc duy nhất và khóa ngoại."""
    print("\n" + "=" * 70)
    print(" 2. KIỂM TRA RÀNG BUỘC DUY NHẤT VÀ CÁC KHÓA NGOẠI LIÊN QUAN")
    print("=" * 70)
    
    results = []
    
    leader = users["truongnhom1@example.com"]
    member = users["thanhvien1@example.com"]
    NON_EXISTENT_ID = 999999
    
    # ─────────────────────────────────────────────────────────────────
    # TC-01: Ràng buộc duy nhất của email (uq_users_email)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-01] Kiểm tra ràng buộc duy nhất của Email (uq_users_email)...")
    try:
        duplicate_user = User(
            email=leader.email,  # Trùng email đã có
            full_name="Duplicate Email Tester",
            hashed_password="hash",
            role=UserRole.STUDENT,
        )
        db.add(duplicate_user)
        db.commit()
        # Nếu lưu thành công là vi phạm ràng buộc
        status_01 = "FAILED"
        msg_01 = "Hệ thống không chặn được email trùng lặp!"
    except IntegrityError as exc:
        db.rollback()
        status_01 = "PASSED"
        msg_01 = f"Bắt đúng lỗi IntegrityError (Duplicate entry '{leader.email}')"
        print(f"  -> KẾT QUẢ: {status_01}. {msg_01}")
    results.append({
        "id": "TC-01",
        "constraint": "UNIQUE (users.email)",
        "description": "Thêm tài khoản có email trùng với tài khoản đã tồn tại",
        "expected": "Bắt lỗi IntegrityError / Duplicate entry",
        "status": status_01,
        "detail": msg_01,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-02: Khóa ngoại projects.owner_id -> users.id (fk_projects_owner)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-02] Kiểm tra khóa ngoại fk_projects_owner (owner_id không tồn tại)...")
    try:
        invalid_project = Project(
            name="Dự án có chủ sở hữu ảo",
            owner_id=NON_EXISTENT_ID,
        )
        db.add(invalid_project)
        db.commit()
        status_02 = "FAILED"
        msg_02 = "Cho phép tạo dự án với owner_id không tồn tại!"
    except IntegrityError as exc:
        db.rollback()
        status_02 = "PASSED"
        msg_02 = f"Chặn thành công do owner_id={NON_EXISTENT_ID} vi phạm khóa ngoại fk_projects_owner"
        print(f"  -> KẾT QUẢ: {status_02}. {msg_02}")
    results.append({
        "id": "TC-02",
        "constraint": "FK projects.owner_id -> users.id",
        "description": "Tạo dự án với owner_id không tồn tại trong hệ thống",
        "expected": "Bắt lỗi IntegrityError (Foreign key constraint fails)",
        "status": status_02,
        "detail": msg_02,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-03: Khóa ngoại project_members.user_id -> users.id (fk_pm_user)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-03] Kiểm tra khóa ngoại fk_pm_user (user_id không tồn tại)...")
    # Tạo trước 1 project hợp lệ để thử nghiệm
    valid_project = Project(
        name="Dự án Thử nghiệm Ràng buộc",
        owner_id=leader.id,
        status="planning",
    )
    db.add(valid_project)
    db.commit()
    db.refresh(valid_project)
    
    try:
        invalid_pm = ProjectMember(
            project_id=valid_project.id,
            user_id=NON_EXISTENT_ID,
            role=ProjectMemberRole.MEMBER,
        )
        db.add(invalid_pm)
        db.commit()
        status_03 = "FAILED"
        msg_03 = "Cho phép thêm thành viên với user_id không tồn tại!"
    except IntegrityError:
        db.rollback()
        status_03 = "PASSED"
        msg_03 = f"Chặn thành công do user_id={NON_EXISTENT_ID} vi phạm khóa ngoại fk_pm_user"
        print(f"  -> KẾT QUẢ: {status_03}. {msg_03}")
    results.append({
        "id": "TC-03",
        "constraint": "FK project_members.user_id -> users.id",
        "description": "Thêm thành viên với user_id không tồn tại",
        "expected": "Bắt lỗi IntegrityError (Foreign key constraint fails)",
        "status": status_03,
        "detail": msg_03,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-04: Khóa ngoại project_members.project_id -> projects.id (fk_pm_project)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-04] Kiểm tra khóa ngoại fk_pm_project (project_id không tồn tại)...")
    try:
        invalid_pm_proj = ProjectMember(
            project_id=NON_EXISTENT_ID,
            user_id=member.id,
            role=ProjectMemberRole.MEMBER,
        )
        db.add(invalid_pm_proj)
        db.commit()
        status_04 = "FAILED"
        msg_04 = "Cho phép thêm thành viên vào project_id không tồn tại!"
    except IntegrityError:
        db.rollback()
        status_04 = "PASSED"
        msg_04 = f"Chặn thành công do project_id={NON_EXISTENT_ID} vi phạm khóa ngoại fk_pm_project"
        print(f"  -> KẾT QUẢ: {status_04}. {msg_04}")
    results.append({
        "id": "TC-04",
        "constraint": "FK project_members.project_id -> projects.id",
        "description": "Thêm thành viên vào dự án không tồn tại",
        "expected": "Bắt lỗi IntegrityError (Foreign key constraint fails)",
        "status": status_04,
        "detail": msg_04,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-05: Ràng buộc duy nhất thành viên trong dự án (uq_pm_project_user)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-05] Kiểm tra ràng buộc duy nhất uq_pm_project_user (thêm trùng thành viên)...")
    # Thêm lần 1 thành công
    first_member = ProjectMember(
        project_id=valid_project.id,
        user_id=member.id,
        role=ProjectMemberRole.MEMBER,
    )
    db.add(first_member)
    db.commit()
    
    try:
        # Thêm lần 2 cùng user vào cùng project
        dup_member = ProjectMember(
            project_id=valid_project.id,
            user_id=member.id,
            role=ProjectMemberRole.ADMIN,
        )
        db.add(dup_member)
        db.commit()
        status_05 = "FAILED"
        msg_05 = "Cho phép thêm trùng lặp cùng 1 user vào 1 dự án!"
    except IntegrityError:
        db.rollback()
        status_05 = "PASSED"
        msg_05 = "Chặn thành công trùng lặp cặp (project_id, user_id) theo uq_pm_project_user"
        print(f"  -> KẾT QUẢ: {status_05}. {msg_05}")
    results.append({
        "id": "TC-05",
        "constraint": "UNIQUE (project_id, user_id)",
        "description": "Thêm cùng một thành viên vào một dự án hai lần",
        "expected": "Bắt lỗi IntegrityError (Duplicate entry for uq_pm_project_user)",
        "status": status_05,
        "detail": msg_05,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-06: Khóa ngoại tasks.project_id -> projects.id (fk_tasks_project)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-06] Kiểm tra khóa ngoại fk_tasks_project (project_id không tồn tại)...")
    try:
        invalid_task = Task(
            title="Task không có dự án",
            project_id=NON_EXISTENT_ID,
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.TODO,
        )
        db.add(invalid_task)
        db.commit()
        status_06 = "FAILED"
        msg_06 = "Cho phép tạo task với project_id không tồn tại!"
    except IntegrityError:
        db.rollback()
        status_06 = "PASSED"
        msg_06 = f"Chặn thành công do project_id={NON_EXISTENT_ID} vi phạm khóa ngoại fk_tasks_project"
        print(f"  -> KẾT QUẢ: {status_06}. {msg_06}")
    results.append({
        "id": "TC-06",
        "constraint": "FK tasks.project_id -> projects.id",
        "description": "Tạo công việc cho dự án không tồn tại",
        "expected": "Bắt lỗi IntegrityError (Foreign key constraint fails)",
        "status": status_06,
        "detail": msg_06,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-07: Khóa ngoại tasks.assignee_id -> users.id (fk_tasks_assignee)
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-07] Kiểm tra khóa ngoại fk_tasks_assignee (assignee_id không tồn tại)...")
    try:
        invalid_assignee_task = Task(
            title="Task giao cho người ảo",
            project_id=valid_project.id,
            assignee_id=NON_EXISTENT_ID,
            priority=TaskPriority.HIGH,
            status=TaskStatus.TODO,
        )
        db.add(invalid_assignee_task)
        db.commit()
        status_07 = "FAILED"
        msg_07 = "Cho phép gán task cho assignee_id không tồn tại!"
    except IntegrityError:
        db.rollback()
        status_07 = "PASSED"
        msg_07 = f"Chặn thành công do assignee_id={NON_EXISTENT_ID} vi phạm khóa ngoại fk_tasks_assignee"
        print(f"  -> KẾT QUẢ: {status_07}. {msg_07}")
    results.append({
        "id": "TC-07",
        "constraint": "FK tasks.assignee_id -> users.id",
        "description": "Giao công việc cho người dùng không tồn tại",
        "expected": "Bắt lỗi IntegrityError (Foreign key constraint fails)",
        "status": status_07,
        "detail": msg_07,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-08: Kiểm tra ON DELETE CASCADE khi xóa Project
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-08] Kiểm tra hành vi ON DELETE CASCADE khi xóa Project...")
    # Tạo task hợp lệ gắn vào valid_project
    valid_task = Task(
        title="Task kiểm tra Cascade Delete",
        project_id=valid_project.id,
        assignee_id=member.id,
        priority=TaskPriority.URGENT,
        status=TaskStatus.IN_PROGRESS,
    )
    db.add(valid_task)
    db.commit()
    task_id = valid_task.id
    project_id = valid_project.id

    # Xóa project
    db.delete(valid_project)
    db.commit()

    # Kiểm tra xem task và project_member có bị xóa theo CASCADE không
    remaining_task = db.query(Task).filter(Task.id == task_id).first()
    remaining_pm = db.query(ProjectMember).filter(ProjectMember.project_id == project_id).first()
    
    if remaining_task is None and remaining_pm is None:
        status_08 = "PASSED"
        msg_08 = f"Xóa Project {project_id} đã tự động CASCADE xóa Task {task_id} và các ProjectMember liên quan"
    else:
        status_08 = "FAILED"
        msg_08 = "Task hoặc ProjectMember vẫn còn tồn tại mồ côi sau khi xóa Project!"
    print(f"  -> KẾT QUẢ: {status_08}. {msg_08}")
    results.append({
        "id": "TC-08",
        "constraint": "ON DELETE CASCADE (Project -> Tasks, Members)",
        "description": "Xóa dự án và kiểm tra các task, thành viên dự án tự động xóa theo",
        "expected": "Task và ProjectMember liên kết tự động bị xóa (CASCADE)",
        "status": status_08,
        "detail": msg_08,
    })

    # ─────────────────────────────────────────────────────────────────
    # TC-09: Kiểm tra ON DELETE SET NULL khi xóa Assignee User
    # ─────────────────────────────────────────────────────────────────
    print("\n[TC-09] Kiểm tra hành vi ON DELETE SET NULL khi xóa User được giao việc...")
    # Tạo 1 user tạm để xóa
    temp_user = User(
        email="temp_worker@example.com",
        full_name="Temporary Worker",
        hashed_password="hash",
        role=UserRole.STUDENT,
    )
    db.add(temp_user)
    db.commit()
    db.refresh(temp_user)
    
    # Tạo 1 project mới
    proj2 = Project(
        name="Dự án Test SET NULL",
        owner_id=leader.id,
    )
    db.add(proj2)
    db.commit()
    db.refresh(proj2)

    # Gán task cho temp_user
    task_set_null = Task(
        title="Task kiểm tra SET NULL",
        project_id=proj2.id,
        assignee_id=temp_user.id,
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.TODO,
    )
    db.add(task_set_null)
    db.commit()
    db.refresh(task_set_null)

    # Xóa temp_user
    db.delete(temp_user)
    db.commit()

    # Truy vấn lại task
    db.refresh(task_set_null)
    if task_set_null.assignee_id is None:
        status_09 = "PASSED"
        msg_09 = "Khi xóa User, assignee_id trên task tự động chuyển thành NULL an toàn"
    else:
        status_09 = "FAILED"
        msg_09 = f"assignee_id vẫn còn giữ giá trị {task_set_null.assignee_id}"
    print(f"  -> KẾT QUẢ: {status_09}. {msg_09}")
    results.append({
        "id": "TC-09",
        "constraint": "ON DELETE SET NULL (User -> tasks.assignee_id)",
        "description": "Xóa người dùng đang được phân công task",
        "expected": "tasks.assignee_id được gán về NULL",
        "status": status_09,
        "detail": msg_09,
    })

    # Dọn dẹp proj2
    db.delete(proj2)
    db.commit()

    return results


def print_summary_table(results: list[dict]):
    """Hiển thị bảng tổng kết kết quả kiểm tra dạng Markdown và Terminal."""
    print("\n" + "=" * 110)
    print(" BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ RÀNG BUỘC TOÀN VẸN CƠ SỞ DỮ LIỆU")
    print("=" * 110)
    print(f"{'Mã TC':<7} | {'Ràng buộc / Khóa ngoại':<32} | {'Trạng thái':<10} | {'Mô tả kiểm thử':<50}")
    print("-" * 110)
    for r in results:
        print(f"{r['id']:<7} | {r['constraint']:<32} | {r['status']:<10} | {r['description']:<50}")
    print("=" * 110)
    
    passed_count = sum(1 for r in results if r["status"] == "PASSED")
    total_count = len(results)
    print(f"Tổng kết: {passed_count}/{total_count} Test Cases ĐẠT ({passed_count/total_count*100:.1f}%)\n")


def main():
    db = SessionLocal()
    try:
        users = seed_sample_accounts(db)
        results = run_constraint_verifications(db, users)
        print_summary_table(results)
    finally:
        db.close()


if __name__ == "__main__":
    main()