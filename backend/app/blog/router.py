from typing import List, Optional
from app.auth.dependencies import UserDependency
from app.blog.dependencies import UserBlogDependency
from app.blog.schemas import BlogResponse, BlogDetailResponse, BlogEditRequest, TagOperationRequest
from app.blog.service import (
    create_blog_service,
    delete_blog_service,
    get_blog_service,
    list_blogs_service,
    publish_or_delist_blog_service,
    search_blogs_service,
    update_blog_service,
    add_tags_to_blog_service,
    remove_tags_from_blog_service,
)
from app.blog.types import BlogSortBy, BlogSortOrder
from app.db.dependencies import DatabaseDependency

from fastapi import APIRouter, Query, Request

from app.limiter import limiter
from app.user.dependencies import CanCreateBlogDependency


router = APIRouter()


@router.post("/", response_model=BlogResponse)
@limiter.limit("10/hour")
async def create_blog(
    request: Request,
    user: UserDependency,
    db: DatabaseDependency,
    _: CanCreateBlogDependency,
):
    return await create_blog_service(user, db)


@router.get("/", response_model=List[BlogResponse])
@limiter.limit("100/minute")
async def list_blogs(
    request: Request,
    db: DatabaseDependency,
    user: UserDependency
):
    return await list_blogs_service(user, db)


@router.get("/search", response_model=List[BlogResponse])
@limiter.limit("60/minute")
async def search_blogs(
    request: Request,
    db: DatabaseDependency,
    search: Optional[str] = Query(None, min_length=3, max_length=50),
    tags: Optional[List[str]] = Query(None),
    tags_match_all: bool = Query(False),
    authors: Optional[List[str]] = Query(None),
    sort_by: BlogSortBy = Query(BlogSortBy.SUBJECT),
    sort_order: BlogSortOrder = Query(BlogSortOrder.ASC),
):
    return await search_blogs_service(db, search, tags, tags_match_all, authors, sort_by, sort_order)


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
    blog: UserBlogDependency,
    db: DatabaseDependency,
):
    return await publish_or_delist_blog_service(blog.id, db, True)

@router.post("/{blog_id}/delist", response_model=BlogResponse)
@limiter.limit("20/hour")
async def delist_blog(
    request: Request,
    blog: UserBlogDependency,
    db: DatabaseDependency,
):
    return await publish_or_delist_blog_service(blog.id, db, False)


@router.patch("/{blog_id}", response_model=BlogDetailResponse)
@limiter.limit("30/hour")
async def update_blog(
    request: Request,
    blog: UserBlogDependency,
    blog_edit: BlogEditRequest,
    db: DatabaseDependency,
):
    return await update_blog_service(blog.id, blog_edit, db)


@router.delete("/{blog_id}", status_code=204)
@limiter.limit("20/hour")
async def delete_blog(
    request: Request,
    blog: UserBlogDependency,
    db: DatabaseDependency,
):
    return await delete_blog_service(blog, db)


@router.post("/{blog_id}/tags", response_model=BlogDetailResponse)
@limiter.limit("50/hour")
async def add_tags_to_blog(
    request: Request,
    blog: UserBlogDependency,
    tag_request: TagOperationRequest,
    db: DatabaseDependency,
):
    return await add_tags_to_blog_service(blog.id, tag_request.tags, db)


@router.delete("/{blog_id}/tags", response_model=BlogDetailResponse)
@limiter.limit("50/hour")
async def remove_tags_from_blog(
    request: Request,
    blog: UserBlogDependency,
    tag_request: TagOperationRequest,
    db: DatabaseDependency,
):
    return await remove_tags_from_blog_service(blog.id, tag_request.tags, db)
