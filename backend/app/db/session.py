"""Kết nối MySQL bằng SQLAlchemy (đồng bộ qua PyMySQL)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# Engine kết nối MySQL; pool_pre_ping tự nối lại khi kết nối cũ bị ngắt, pool_recycle tránh lỗi "MySQL server has gone away".
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Mỗi lần gọi SessionLocal() tạo ra 1 phiên làm việc với DB.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


# Lớp cơ sở cho mọi model (bảng).
class Base(DeclarativeBase):
    pass


# Dependency cho FastAPI: mở session cho mỗi request và luôn đóng lại sau đó.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

