from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.comment.models import Sentiment


class UserPublicProfileResponse(BaseModel):
    username: str
    first_name: str
    last_name: str
    follower_count: int
    following_count: int


class UserPrivateProfileResponse(UserPublicProfileResponse):
    email: str
    phone: str


class UserCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    sentiment: Sentiment
    blog_id: int
    blog_subject: Optional[str] = None
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
