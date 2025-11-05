from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.comment.models import Sentiment


class CommentCreateRequest(BaseModel):
    content: str
    sentiment: Sentiment
    parent_comment_id: Optional[int] = None


class CommentUpdateRequest(BaseModel):
    content: str
    sentiment: Sentiment


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    sentiment: Sentiment
    blog_id: int
    author_username: str
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
