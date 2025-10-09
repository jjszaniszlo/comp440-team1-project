from datetime import date
from typing import TYPE_CHECKING, List

from sqlalchemy import CheckConstraint, String, Integer, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import BaseModel

if TYPE_CHECKING:
    from app.auth.models import User
    from app.comment.models import Comment
    from app.blog.models import Blog


class UserLimits(BaseModel):
    __tablename__ = "user_limits"

    username: Mapped[str] = mapped_column(
        String(50),
        ForeignKey(
            "user.username",
            ondelete="CASCADE"
        ),
        primary_key=True
    )
    comment_creation_limit: Mapped[int] = mapped_column(
        Integer, 
        nullable=False,
        default=0
    )
    blog_creation_limit: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates="limits"
    )

    __table_args__ = (
        CheckConstraint('comment_creation_limit >= 0', name='check_comment_limit_non_negative'),
        CheckConstraint('blog_creation_limit >= 0', name='check_blog_limit_non_negative'),
    )


class UserDailyActivity(BaseModel):
    __tablename__ = "user_daily_activity"

    username: Mapped[str] = mapped_column(
        String(50),
        ForeignKey(
            "user.username",
            ondelete="CASCADE"
        ),
        primary_key=True
    )
    activity_date: Mapped[date] = mapped_column(Date, primary_key=True)
    comments_made: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    blogs_made: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="activity_history",
    )

    __table_args__ = (
        CheckConstraint('comments_made >= 0', name='check_comments_made_non_negative'),
        CheckConstraint('blogs_made >= 0', name='check_blogs_made_non_negative'),
    )
