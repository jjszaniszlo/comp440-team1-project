import re
from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates

from app.models import BaseModel

if TYPE_CHECKING:
    from app.blog.models import Blog
    from app.comment.models import Comment
    from app.follow.models import UserFollow
    from app.user.models import UserDailyActivity
    from app.user.models import UserLimits


class User(BaseModel):
    __tablename__ = "user"

    username: Mapped[str] = mapped_column(primary_key=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(unique=True, index=True)
    phone: Mapped[str] = mapped_column(unique=True, index=True)
    first_name: Mapped[str] = mapped_column()
    last_name: Mapped[str] = mapped_column()

    blogs: Mapped[List["Blog"]] = relationship("Blog", back_populates="author")
    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="author")
    limits: Mapped["UserLimits"] = relationship("UserLimits", back_populates="user")
    activity_history: Mapped["List[UserDailyActivity]"] = relationship("UserDailyActivity", back_populates="user")
    followers: Mapped[List["UserFollow"]] = relationship(
        "UserFollow",
        foreign_keys="UserFollow.following_username",
        back_populates="following"
    )
    following: Mapped[List["UserFollow"]] = relationship(
        "UserFollow",
        foreign_keys="UserFollow.follower_username",
        back_populates="follower"
    )

    @validates("email")
    def validate_email(self, _, email):
        if not re.match(r"^\S+@\S+\.\S+$", email):
            raise ValueError(f"Invalid email format: {email}")
        return email

    @validates("phone")
    def validate_phone(self, _, phone):
        if not re.match(r"^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$", phone):
            raise ValueError(f"Invalid phone number format: {phone}")
        return phone

    @validates("first_name", "last_name")
    def validate_name(self, key, name):
        if not name.isalpha():
            raise ValueError(f"{key.replace('_', ' ').title()} must contain only alphabetic characters.")
        return name

    @validates("username")
    def validate_username(self, _, username):
        if not re.match(r"^[A-Za-z][A-Za-z0-9_]{5,29}$", username):
            raise ValueError(f"Invalid username format: {username}")
        return username
