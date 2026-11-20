# d:\team-project-manager\backend\app\scripts\add_sample_tasks.py
"""
Demo script to populate sample tasks for projects.
It uses the existing SQLAlchemy SessionLocal and the Task model.
Adjust the sample data as needed.
"""

import sys
from pathlib import Path

# Ensure the project root is on the import path
ROOT = Path(__file__).resolve().parents[3]  # .../backend/app
sys.path.append(str(ROOT))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.tasks import Task, TaskPriority, TaskStatus
from app.models.projects import Project
from datetime import date


def create_task(db: Session, **kwargs) -> Task:
    task = Task(**kwargs)
    db.add(task)
    return task


def main() -> None:
    db: Session = SessionLocal()
    try:
        # 1️⃣ Sample tasks data
        sample_tasks = [
            {
                "title": "Thiết kế giao diện Kanban",
                "description": "Tạo UI kéo thả cho các task trên board.",
                "due_date": date(2026, 12, 10),
                "priority": TaskPriority.HIGH,
                "status": TaskStatus.IN_PROGRESS,
                "assignee_id": 2,  # bob@example.com
                "project_id": 1,
            },
            {
                "title": "Viết tài liệu API",
                "description": "Cập nhật swagger và README cho các endpoint.",
                "due_date": date(2026, 12, 15),
                "priority": TaskPriority.MEDIUM,
                "status": TaskStatus.TODO,
                "assignee_id": None,
                "project_id": 2,
            },
            {
                "title": "Triển khai CI/CD",
                "description": "Cấu hình GitHub Actions để build và deploy.",
                "due_date": date(2026, 12, 20),
                "priority": TaskPriority.URGENT,
                "status": TaskStatus.TODO,
                "assignee_id": 3,  # carol@example.com
                "project_id": 3,
            },
        ]

        for data in sample_tasks:
            # Ensure the referenced project exists
            project: Project = db.query(Project).filter(Project.id == data["project_id"]).first()
            if not project:
                print(f"⚠️  Project id={data['project_id']} not found – skipping task '{data['title']}'.")
                continue
            create_task(db, **data)
            print(f"✅ Added task: {data['title']} (project_id={data['project_id']})")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
