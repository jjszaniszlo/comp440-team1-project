from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request

from app.auth.dependencies import UserDependency
from app.blog.dependencies import UserAuthorizedOwnedBlog, UserCanCreateBlogDependency
from app.blog.schemas import (
    BlogDetailResponse,
    BlogEditRequest,
    BlogResponse,
    BlogSearchResponse,
    TagOperationRequest,
    UserLiteResponse,
    UserQueryParams,
)
from app.blog.service import (
    add_tags_to_blog_service,
    create_blog_service,
    delete_blog_service,
    get_blog_service,
    list_blogs_service,
    publish_or_delist_blog_service,
    remove_tags_from_blog_service,
    search_blogs_service,
    update_blog_service,
    search_users_service,
)
from app.blog.types import BlogSortBy, BlogSortOrder
from app.db.dependencies import DatabaseDependency
from app.limiter import limiter
from app.schemas import PaginatedResponse

# For dates
from datetime import date as DateType

router = APIRouter()


@router.post("/", response_model=BlogResponse)
@limiter.limit("10/hour")
async def create_blog(
    request: Request,
    user: UserDependency,
    db: DatabaseDependency,
    _: UserCanCreateBlogDependency,
):
    return await create_blog_service(user, db)


@router.get("/", response_model=List[BlogResponse])
@limiter.limit("100/minute")
async def list_blogs(request: Request, db: DatabaseDependency, user: UserDependency):
    return await list_blogs_service(user, db)


@router.get("/search", response_model=PaginatedResponse[BlogSearchResponse])
@limiter.limit("60/minute")
async def search_blogs(
    request: Request,
    db: DatabaseDependency,
    search: Optional[str] = Query(None, min_length=2, max_length=100),
    tags: Optional[List[str]] = Query(None),
    tags_match_all: bool = Query(False),
    authors: Optional[List[str]] = Query(None),
    sort_by: BlogSortBy = Query(BlogSortBy.RELEVANCE),
    sort_order: BlogSortOrder = Query(BlogSortOrder.DESC),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    return await search_blogs_service(
        db, search, tags, tags_match_all, authors, sort_by, sort_order, page, size
    )


@router.get("/{blog_id}", response_model=BlogDetailResponse)
@limiter.limit("100/minute")
async def get_blog(
    request: Request,
    blog_id: int,
    db: DatabaseDependency,
):
    return await get_blog_service(blog_id, db)


@router.post("/{blog_id}/publish", response_model=BlogResponse)
@limiter.limit("20/hour")
async def publish_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    db: DatabaseDependency,
):
    return await publish_or_delist_blog_service(blog.id, db, True)


@router.post("/{blog_id}/delist", response_model=BlogResponse)
@limiter.limit("20/hour")
async def delist_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    db: DatabaseDependency,
):
    return await publish_or_delist_blog_service(blog.id, db, False)


@router.patch("/{blog_id}", response_model=BlogDetailResponse)
@limiter.limit("30/hour")
async def update_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    blog_edit: BlogEditRequest,
    db: DatabaseDependency,
):
    return await update_blog_service(blog.id, blog_edit, db)


@router.delete("/{blog_id}", status_code=204)
@limiter.limit("20/hour")
async def delete_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    db: DatabaseDependency,
):
    return await delete_blog_service(blog, db)


@router.post("/{blog_id}/tags", response_model=BlogDetailResponse)
@limiter.limit("50/hour")
async def add_tags_to_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    tag_request: TagOperationRequest,
    db: DatabaseDependency,
):
    return await add_tags_to_blog_service(blog.id, tag_request.tags, db)


@router.delete("/{blog_id}/tags", response_model=BlogDetailResponse)
@limiter.limit("50/hour")
async def remove_tags_from_blog(
    request: Request,
    blog: UserAuthorizedOwnedBlog,
    tag_request: TagOperationRequest,
    db: DatabaseDependency,
):
    return await remove_tags_from_blog_service(blog.id, tag_request.tags, db)

# User search endpoint
@router.get("/users/search", response_model=List[UserLiteResponse])
@limiter.limit("60/minute")
async def search_users(
    request: Request,
    db: DatabaseDependency,
    tags: List[str] = Query(default=[], description="List of tags to filter by"),
    same_day_tags: bool = Query(default=False, description="Whether to require all tags on same day"),
    date: Optional[str] = Query(default=None, description="Date to filter by (YYYY-MM-DD format)"),
    followed_by: List[str] = Query(default=[], description="List of usernames - find users followed by ALL of these users"),
    never_posted_blog: bool = Query(default=False, description="Return users who have never posted a blog"),
):
    # Create params object from individual query parameters
    params = UserQueryParams(
        tags=tags,
        same_day_tags=same_day_tags,
        date=date,
        followed_by=followed_by,
        never_posted_blog=never_posted_blog
    )
    return await search_users_service(db, params)
