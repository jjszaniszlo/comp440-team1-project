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