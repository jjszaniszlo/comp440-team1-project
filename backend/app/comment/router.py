from typing import List, Union
from fastapi import APIRouter, Query, Request

from app.auth.dependencies import UserDependency
from app.comment.dependencies import BlogCommentDependency, UserBlogCommentDependency
from app.comment.schemas import (
    CommentCreateRequest,
    CommentUpdateRequest,
    CommentResponse,
    CommentWithRepliesResponse,
)
from app.comment.service import (
    create_comment_service,
    list_blog_comments_service,
    get_comment_service,
    update_comment_service,
    delete_comment_service,
)
from app.db.dependencies import DatabaseDependency
from app.limiter import limiter
from app.user.dependencies import CanCommentDependency


router = APIRouter()


@router.post(
    "/{blog_id}/comments",
    response_model=CommentResponse,
    status_code=201,
)
@limiter.limit("20/hour")
async def create_comment(
    request: Request,
    blog_id: int,
    comment_data: CommentCreateRequest,
    user: UserDependency,
    db: DatabaseDependency,
    _: CanCommentDependency,
):
    return await create_comment_service(blog_id, comment_data, user, db)


@router.get(
    "/{blog_id}/comments",
    response_model=List[Union[CommentWithRepliesResponse, CommentResponse]],
)
@limiter.limit("100/minute")
async def list_blog_comments(
    request: Request,
    blog_id: int,
    db: DatabaseDependency,
    include_replies: bool = Query(True, description="Include nested replies"),
):
    return await list_blog_comments_service(blog_id, db, include_replies)


@router.get(
    "/{blog_id}/comments/{comment_id}",
    response_model=Union[CommentWithRepliesResponse, CommentResponse],
)
@limiter.limit("100/minute")
async def get_comment(
    request: Request,
    comment: BlogCommentDependency,
    db: DatabaseDependency,
    include_replies: bool = Query(False, description="Include nested replies"),
):
    return await get_comment_service(comment.id, db, include_replies)


@router.patch(
    "/{blog_id}/comments/{comment_id}",
    response_model=CommentResponse,
)
@limiter.limit("30/hour")
async def update_comment(
    request: Request,
    comment: UserBlogCommentDependency,
    comment_data: CommentUpdateRequest,
    db: DatabaseDependency,
):
    return await update_comment_service(comment.id, comment_data, db)


@router.delete(
    "/{blog_id}/comments/{comment_id}",
    status_code=204,
)
@limiter.limit("20/hour")
async def delete_comment(
    request: Request,
    comment: UserBlogCommentDependency,
    db: DatabaseDependency,
):
    await delete_comment_service(comment.id, db)
