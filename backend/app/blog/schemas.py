from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BlogEditRequest(BaseModel):
    subject: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class TagOperationRequest(BaseModel):
    tags: List[str]


class BlogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    author_username: str
    status: str
    created_at: datetime
    updated_at: datetime


class BlogSearchResponse(BlogResponse):
    subject: str
    tags: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def extract_tag_names(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "tags" in data and data["tags"]:
                data["tags"] = [
                    tag.name if hasattr(tag, "name") else tag for tag in data["tags"]
                ]
        elif hasattr(data, "tags") and data.tags:
            tag_names = [tag.name for tag in data.tags]
            data_dict = {
                "id": data.id,
                "subject": data.subject,
                "author_username": data.author_username,
                "status": data.status,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
                "tags": tag_names,
            }
            return data_dict
        return data


class BlogDetailResponse(BlogResponse):
    subject: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    tags: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def extract_tag_names(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "tags" in data and data["tags"]:
                data["tags"] = [
                    tag.name if hasattr(tag, "name") else tag for tag in data["tags"]
                ]
        elif hasattr(data, "tags") and data.tags:
            tag_names = [tag.name for tag in data.tags]
            data_dict = {
                "id": data.id,
                "subject": data.subject,
                "author_username": data.author_username,
                "status": data.status,
                "created_at": data.created_at,
                "updated_at": data.updated_at,
                "description": data.description,
                "content": data.content,
                "tags": tag_names,
            }
            return data_dict
        return data

# Lightweight user response schema - only returns username
class UserLiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str


# Query parameters for user search - using Query fields for proper FastAPI handling
class UserQueryParams(BaseModel):
    tag_x: Optional[str] = Field(None, description="First tag to filter by")
    tag_y: Optional[str] = Field(None, description="Second tag to filter by")
    same_day_tags: bool = Field(
        False, description="Whether to require both tags on same day"
    )
    date: Optional[str] = Field(
        None, description="Date to filter by (YYYY-MM-DD format)"
    )
    most_blogs_on_date: bool = Field(
        False, description="Whether to return users with most blogs on the given date"
    )
    followed_by_x: Optional[str] = Field(
        None, description="First username - find users followed by this user"
    )
    followed_by_y: Optional[str] = Field(
        None, description="Second username - find users followed by this user"
    )
    never_posted_blog: bool = Field(
        False, description="Return users who have never posted a blog"
    )
