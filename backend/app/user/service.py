from typing import List

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.blog.models import Blog
from app.comment.models import Comment
from app.follow.models import UserFollow
from app.user.schemas import (
    UserCommentResponse,
    UserPrivateProfileResponse,
    UserPublicProfileResponse,
)


async def get_user_with_counts(username: str, db: AsyncSession) -> dict:
    user = await db.get(User, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{username}' not found",
        )

    follower_stmt = (
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.following_username == username)
    )
    follower_count = await db.scalar(follower_stmt) or 0

    following_stmt = (
        select(func.count())
        .select_from(UserFollow)
        .where(UserFollow.follower_username == username)
    )
    following_count = await db.scalar(following_stmt) or 0

    return {
        "user": user,
        "follower_count": follower_count,
        "following_count": following_count,
    }


async def get_public_profile_service(
    username: str, db: AsyncSession
) -> UserPublicProfileResponse:
    data = await get_user_with_counts(username, db)
    user = data["user"]

    return UserPublicProfileResponse(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        follower_count=data["follower_count"],
        following_count=data["following_count"],
    )


async def get_private_profile_service(
    current_user: User, db: AsyncSession
) -> UserPrivateProfileResponse:
    data = await get_user_with_counts(current_user.username, db)
    user = data["user"]

    return UserPrivateProfileResponse(
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        follower_count=data["follower_count"],
        following_count=data["following_count"],
    )


async def get_user_comments_service(
    username: str, db: AsyncSession
) -> List[UserCommentResponse]:
    user = await db.get(User, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{username}' not found",
        )

    stmt = (
        select(Comment, Blog.subject)
        .join(Blog, Blog.id == Comment.blog_id)
        .where(Comment.author_username == username)
        .order_by(Comment.created_at.desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    comments = []
    for comment, blog_subject in rows:
        comments.append(
            UserCommentResponse(
                id=comment.id,
                content=comment.content,
                sentiment=comment.sentiment,
                blog_id=comment.blog_id,
                blog_subject=blog_subject,
                parent_comment_id=comment.parent_comment_id,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
            )
        )

    return comments
