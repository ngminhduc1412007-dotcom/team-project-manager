"""
Model SQLAlchemy cho bảng project_members.

Quan hệ:
  Project  ──< ProjectMember >──  User
                   │
                 role (ENUM)
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .base import Base  # thay bằng import Base của project bạn


# ---------------------------------------------------------------------------
# Enum vai trò – đồng bộ với ENUM trong SQL
# ---------------------------------------------------------------------------
class MemberRole(str, enum.Enum):
    owner  = "owner"
    admin  = "admin"
    member = "member"
    viewer = "viewer"


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
class ProjectMember(Base):
    __tablename__ = "project_members"

    # Ràng buộc UNIQUE (project_id, user_id) ở cấp bảng
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_pm_project_user"),
    )

    id         = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(
        Integer,
        ForeignKey("projects.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    user_id    = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )
    role      = Column(
        Enum(MemberRole),
        nullable=False,
        default=MemberRole.member,
    )
    joined_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # ------------------------------------------------------------------
    # Relationships (lazy="select" mặc định; dùng "joined" nếu cần eager)
    # ------------------------------------------------------------------
    project = relationship("Project", back_populates="members")
    user    = relationship("User",    back_populates="project_memberships")

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    def __repr__(self) -> str:
        return (
            f"<ProjectMember project_id={self.project_id} "
            f"user_id={self.user_id} role={self.role}>"
        )

    def to_dict(self) -> dict:
        return {
            "id":         self.id,
            "project_id": self.project_id,
            "user_id":    self.user_id,
            "role":       self.role.value,
            "joined_at":  self.joined_at.isoformat() if self.joined_at else None,
        }

