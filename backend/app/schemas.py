from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for pagination"""

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    size: int = Field(20, ge=1, le=100, description="Items per page")


class PaginationMeta(BaseModel):
    """Pagination metadata"""

    page: int = Field(..., description="Current page number")
    size: int = Field(..., description="Items per page")
    total: int = Field(..., description="Total number of items")
    pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""

    items: List[T]
    meta: PaginationMeta
