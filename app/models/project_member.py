"""Model thành viên dự án — bảng project_members.

Quan hệ:
    Project  ──< ProjectMember >──  User
                       │
                     role (ENUM)

Ràng buộc:
    - FK  → projects.id  (CASCADE xóa)
    - FK  → users.id     (CASCADE xóa)
    - UNIQUE (project_id, user_id): mỗi user chỉ có 1 vai trò trong 1 project
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MemberRole(str, Enum):
    OWNER  = "owner"
    ADMIN  = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class ProjectMember(Base):
    __tablename__ = "project_members"

    # UNIQUE (project_id, user_id) — đặt ở __table_args__
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_pm_project_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    role: Mapped[MemberRole] = mapped_column(
        SqlEnum(
            MemberRole,
            name="member_role",
            values_callable=lambda e: [item.value for item in e],
        ),
        default=MemberRole.MEMBER,
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # ------------------------------------------------------------------
    # Relationships — thêm back_populates tương ứng vào Project và User
    # ------------------------------------------------------------------
    project = relationship("Project", back_populates="members")
    user    = relationship("User",    back_populates="project_memberships")

    def __repr__(self) -> str:
        return (
            f"<ProjectMember project_id={self.project_id} "
            f"user_id={self.user_id} role={self.role.value}>"
        )

