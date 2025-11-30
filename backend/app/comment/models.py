from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Enum as SqlEnum

from app.models import BaseModel

if TYPE_CHECKING:
    from app.auth.models import User
    from app.blog.models import Blog


def get_current_time():
    return datetime.now(timezone.utc)


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"


class Comment(BaseModel):
    __tablename__ = "comment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    content: Mapped[str] = mapped_column(Text)
    sentiment: Mapped[Sentiment] = mapped_column(
        SqlEnum(Sentiment), default=Sentiment.NEGATIVE
    )
    blog_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("blog.id", ondelete="CASCADE")
    )
    author_username: Mapped[str] = mapped_column(
        String(50), ForeignKey("user.username")
    )
    parent_comment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("comment.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time, onupdate=get_current_time
    )
    blog: Mapped["Blog"] = relationship("Blog", back_populates="comments")
    author: Mapped["User"] = relationship("User", back_populates="comments")
    parent_comment: Mapped[Optional["Comment"]] = relationship(
        "Comment", remote_side=[id], back_populates="replies"
    )
    replies: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="parent_comment", cascade="all, delete-orphan"
    )
