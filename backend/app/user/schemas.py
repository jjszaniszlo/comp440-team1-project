from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

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


class UserLiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str


class UserQueryParams(BaseModel):
    tags: Optional[List[str]] = Field(
        None, description="List of tags to filter by"
    )
    same_day_tags: bool = Field(
        False, description="Whether to require all tags on same day"
    )
    date: Optional[str] = Field(
        None, description="Date to filter by (YYYY-MM-DD format)"
    )
    followed_by: Optional[List[str]] = Field(
        None, description="List of usernames. Find users followed by all of these users"
    )
    never_posted_blog: bool = Field(
        False, description="Return users who have never posted a blog"
    )
    all_negative_comments: bool = Field(
        default=False, description="Return users who posted comments that are all negative"
    )
    no_negative_comments_on_blogs: bool = Field(
        default=False, description="Return users whose blogs have no negative comments"
    )
