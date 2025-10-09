from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class CommentCreateRequest(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None


class CommentUpdateRequest(BaseModel):
    content: str


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    blog_id: int
    author_username: str
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class CommentWithRepliesResponse(CommentResponse):
    replies: List["CommentWithRepliesResponse"] = []


CommentWithRepliesResponse.model_rebuild()
