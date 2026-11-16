from sqlalchemy import inspect, text
from app.db.session import engine


def migrate_projects_table():
    """Tự động kiểm tra và bổ sung các cột còn thiếu trong bảng projects khi khởi động."""
    try:
        with engine.connect() as conn:
            insp = inspect(conn)
            if "projects" not in insp.get_table_names():
                return

            cols = {c["name"] for c in insp.get_columns("projects")}

            if "start_date" not in cols:
                conn.execute(
                    text("ALTER TABLE projects ADD COLUMN start_date DATETIME NULL AFTER description;")
                )
                print("[DB Migration] Đã bổ sung cột 'start_date' vào bảng projects.")

            if "status" not in cols:
                conn.execute(
                    text(
                        "ALTER TABLE projects ADD COLUMN status ENUM('planning', 'in_progress', 'completed') "
                        "NOT NULL DEFAULT 'planning' AFTER deadline;"
                    )
                )
                print("[DB Migration] Đã bổ sung cột 'status' vào bảng projects.")

            conn.commit()
    except Exception as e:
        print(f"[DB Migration] Kiểm tra schema: {e}")


if __name__ == "__main__":
    migrate_projects_table()
