# d:\team-project-manager\backend\app\scripts\add_sample_members.py
"""
Demo script to populate sample users, a project, and project members.
It also confirms that deleting a project cascades to its members.
"""

import sys
from pathlib import Path

# Ensure the project root is on the import path
ROOT = Path(__file__).resolve().parents[3]  # .../backend/app
sys.path.append(str(ROOT))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.users import User
from app.models.projects import Project
from app.crud.users import get_user_by_email, create_user
from app.crud.projects import create_project
from app.crud.project_members import add_project_member_by_email


def get_or_create_user(db: Session, email: str, full_name: str) -> User:
    """Return existing user or create a new one."""
    user = get_user_by_email(db, email=email)
    if user:
        return user
    # Minimal fields; adjust to match your schema
    return create_user(
        db,
        email=email,
        full_name=full_name,
        password="TempPass123!",  # hashed inside create_user
        role="member",
    )


def main() -> None:
    db: Session = SessionLocal()
    try:
        # 1️⃣ Sample users
        users_info = [
            ("alice@example.com", "Alice Nguyen"),
            ("bob@example.com", "Bob Tran"),
            ("carol@example.com", "Carol Pham"),
            ("dave@example.com", "Dave Le"),
        ]
        users = [
            get_or_create_user(db, email=email, full_name=name)
            for email, name in users_info
        ]
        db.commit()

        # 2️⃣ Demo project (owner = first user)
        owner = users[0]
        project = (
            db.query(Project)
            .filter(Project.name == "Demo Project")
            .first()
        )
        if not project:
            project = create_project(
                db,
                name="Demo Project",
                description="Project used for demo data population",
                owner_id=owner.id,
                start_date=None,
                deadline=None,
                status="planning",
            )
            db.commit()

        # 3️⃣ Add members (skip owner)
        for user in users[1:]:
            try:
                add_project_member_by_email(
                    db=db,
                    project_id=project.id,
                    email=user.email,
                    role="member",
                    current_user_id=owner.id,
                )
                print(f"✅ Added {user.email} to project")
            except Exception as exc:
                print(f"⚠️  Could not add {user.email}: {exc}")
        db.commit()

        # 4️⃣ Cascade delete check
        proj_id = project.id
        db.delete(project)
        db.commit()
        remaining = db.query(Project).filter(Project.id == proj_id).first()
        members_left = (
            db.query(Project)
            .join(Project.members)
            .filter(Project.id == proj_id)
            .count()
        )
        print("\n--- Cascade Delete Check ---")
        print(f"Project exists after delete? {'Yes' if remaining else 'No'}")
        print(f"ProjectMember rows remaining? {members_left}")
        if not remaining and members_left == 0:
            print("✅ Cascade works – members were removed automatically.")
        else:
            print("❌ Cascade failed – orphan members remain.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
