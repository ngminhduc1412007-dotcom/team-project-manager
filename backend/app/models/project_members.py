from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.schemas.project_members import ProjectMemberRole

if TYPE_CHECKING:
    from app.models.projects import Project
    from app.models.users import User


# Model bảng project_members: liên kết projects <-> users kèm vai trò thành viên.
class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_pm_project_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    role: Mapped[ProjectMemberRole] = mapped_column(
        Enum(ProjectMemberRole, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProjectMemberRole.MEMBER,
        server_default=ProjectMemberRole.MEMBER.value,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Quan hệ 2 chiều tới dự án và người dùng tương ứng.
    project: Mapped["Project"] = relationship("Project", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="project_memberships")

    def __repr__(self) -> str:
        return (
            f"<ProjectMember id={self.id} project_id={self.project_id} "
            f"user_id={self.user_id} role='{self.role}'>"
        )

