from sqlalchemy import inspect, text
from app.db.session import engine


def migrate_projects_table():
    """Tự động kiểm tra và bổ sung các cột, index còn thiếu trong bảng projects khi khởi động."""
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

            # Kiểm tra và tạo index theo tên và chủ dự án nếu chưa có
            indexes = {idx["name"] for idx in insp.get_indexes("projects")}
            if "idx_projects_name" not in indexes:
                conn.execute(text("CREATE INDEX idx_projects_name ON projects (name);"))
                print("[DB Migration] Đã tạo index 'idx_projects_name'.")

            if "idx_projects_owner_name" not in indexes:
                conn.execute(text("CREATE INDEX idx_projects_owner_name ON projects (owner_id, name);"))
                print("[DB Migration] Đã tạo composite index 'idx_projects_owner_name'.")

            conn.commit()
    except Exception as e:
        print(f"[DB Migration] Kiểm tra schema: {e}")


if __name__ == "__main__":
    migrate_projects_table()