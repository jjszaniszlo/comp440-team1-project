from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import BaseModel

if TYPE_CHECKING:
    from app.auth.models import User


def get_current_time():
    return datetime.now(timezone.utc)


class UserFollow(BaseModel):
    __tablename__ = "user_follow"

    follower_username: Mapped[str] = mapped_column(
        String(50), ForeignKey("user.username", ondelete="CASCADE"), primary_key=True
    )
    following_username: Mapped[str] = mapped_column(
        String(50), ForeignKey("user.username", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time
    )

    follower: Mapped["User"] = relationship(
        "User", foreign_keys=[follower_username], back_populates="following"
    )
    following: Mapped["User"] = relationship(
        "User", foreign_keys=[following_username], back_populates="followers"
    )

    __table_args__ = (
        CheckConstraint(
            "follower_username != following_username", name="check_no_self_follow"
        ),
    )
