from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import BaseModel

if TYPE_CHECKING:
    from app.auth.models import User
    from app.blog.models import Blog


def get_current_time():
    return datetime.now(timezone.utc)


class Comment(BaseModel):
    __tablename__ = "comment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    content: Mapped[str] = mapped_column(Text)
    sentiment: Mapped[bool] = mapped_column()
    blog_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("blog.id", ondelete="CASCADE")
    )
    author_username: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("user.username")
    )
    parent_comment_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("comment.id", ondelete="CASCADE"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        default=get_current_time
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=get_current_time,
        onupdate=get_current_time
    )
    blog: Mapped["Blog"] = relationship("Blog", back_populates="comments")
    author: Mapped["User"] = relationship("User", back_populates="comments")
    parent_comment: Mapped[Optional["Comment"]] = relationship(
        "Comment",
        remote_side=[id],
        back_populates="replies"
    )
    replies: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="parent_comment",
        cascade="all, delete-orphan"
    )