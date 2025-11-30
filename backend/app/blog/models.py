from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.blog.types import BlogStatus
from app.models import BaseModel

if TYPE_CHECKING:
    from app.auth.models import User
    from app.comment.models import Comment


blog_tag_table = Table(
    "blog_tag",
    BaseModel.metadata,
    Column(
        "blog_id", Integer, ForeignKey("blog.id", ondelete="CASCADE"), primary_key=True
    ),
    Column(
        "tag_id", Integer, ForeignKey("tag.id", ondelete="CASCADE"), primary_key=True
    ),
)


def get_current_time():
    return datetime.now(timezone.utc)


class Blog(BaseModel):
    __tablename__ = "blog"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    subject: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[BlogStatus] = mapped_column(
        SQLEnum(BlogStatus), default=BlogStatus.DRAFT, index=True
    )

    author_username: Mapped[str] = mapped_column(
        String(50), ForeignKey("user.username"), index=True
    )
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    downvotes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time, onupdate=get_current_time, index=True
    )
    author: Mapped["User"] = relationship("User", back_populates="blogs")
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", secondary=blog_tag_table, back_populates="blogs"
    )
    comments: Mapped[List["Comment"]] = relationship(
        "Comment", back_populates="blog", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("upvotes >= 0", name="check_upvotes_non_negative"),
        CheckConstraint("downvotes >= 0", name="check_downvotes_non_negative"),
        Index("idx_blog_status_created", "status", "created_at"),
    )


class Tag(BaseModel):
    __tablename__ = "tag"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(50), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_time
    )
    blogs: Mapped[List["Blog"]] = relationship(
        "Blog", secondary=blog_tag_table, back_populates="tags"
    )

    __table_args__ = (
        CheckConstraint("LENGTH(name) > 0", name="check_tag_name_not_empty"),
    )
