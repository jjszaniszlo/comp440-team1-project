from datetime import date
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.blog.exceptions import BlogNotFoundException, handle_database_error
from app.blog.models import Blog
from app.comment.models import Comment
from app.comment.schemas import (
    CommentCreateRequest,
    CommentResponse,
    CommentUpdateRequest,
)
from app.user.models import UserDailyActivity


class CommentNotFoundException(HTTPException):
    def __init__(self, comment_id: int):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with id {comment_id} not found",
        )


async def create_comment_service(
    blog_id: int,
    comment_data: CommentCreateRequest,
    user: User,
    db: AsyncSession,
) -> CommentResponse:
    try:
        blog = await db.get(Blog, blog_id)
        if not blog:
            raise BlogNotFoundException(blog_id)

        if (
            blog.author_username == user.username
            and comment_data.parent_comment_id is None
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot create root-level comments on your own blog. However, you can reply to existing comments.",
            )
        # Editing service to make sure that users can comment "at most one time" on each blog- this only applies
        # to root-level comments, no restrictions on replies
        if comment_data.parent_comment_id is None:
            existing_comment = await db.scalar(
                select(Comment)
                .where(Comment.blog_id == blog_id)
                .where(Comment.author_username == user.username)
                .where(Comment.parent_comment_id.is_(None))
            )

            if existing_comment:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You have already commented on this blog. You can only make one root-level comment, but you can still post replies."
                )
        # end of new stuff for limiting comments to 1 per blog

        if comment_data.parent_comment_id:
            parent_comment = await db.get(Comment, comment_data.parent_comment_id)
            if not parent_comment:
                raise CommentNotFoundException(comment_data.parent_comment_id)
            if parent_comment.blog_id != blog_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent comment does not belong to this blog",
                )
            if parent_comment.author_username == user.username:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot reply to your own comment",
                )

        new_comment = Comment(
            content=comment_data.content,
            sentiment=comment_data.sentiment,
            blog_id=blog_id,
            author_username=user.username,
            parent_comment_id=comment_data.parent_comment_id,
        )
        db.add(new_comment)
        await db.commit()
        await db.refresh(new_comment)

        activity = await db.scalar(
            select(UserDailyActivity).filter_by(
                username=user.username, activity_date=date.today()
            )
        )

        if activity:
            activity.comments_made += 1
            db.add(activity)
            await db.commit()
            await db.refresh(activity)

        return CommentResponse.model_validate(new_comment)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "create comment")


async def list_blog_comments_service(
    blog_id: int,
    db: AsyncSession,
    parent_comment_id: int | None = None,
) -> List[CommentResponse]:
    try:
        blog = await db.get(Blog, blog_id)
        if not blog:
            raise BlogNotFoundException(blog_id)

        if parent_comment_id is None:
            result = await db.scalars(
                select(Comment)
                .where(Comment.blog_id == blog_id)
                .where(Comment.parent_comment_id.is_(None))
            )
        else:
            parent_comment = await db.get(Comment, parent_comment_id)
            if not parent_comment:
                raise CommentNotFoundException(parent_comment_id)
            if parent_comment.blog_id != blog_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent comment does not belong to this blog",
                )

            result = await db.scalars(
                select(Comment)
                .where(Comment.blog_id == blog_id)
                .where(Comment.parent_comment_id == parent_comment_id)
            )

        comments = result.all()
        return [CommentResponse.model_validate(comment) for comment in comments]
    except HTTPException:
        raise
    except Exception as e:
        handle_database_error(e, "list blog comments")


async def update_comment_service(
    comment_id: int,
    comment_data: CommentUpdateRequest,
    db: AsyncSession,
) -> CommentResponse:
    try:
        comment = await db.get(Comment, comment_id)
        if not comment:
            raise CommentNotFoundException(comment_id)

        comment.content = comment_data.content
        comment.sentiment = comment_data.sentiment
        db.add(comment)
        await db.commit()
        await db.refresh(comment)

        return CommentResponse.model_validate(comment)
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "update comment")


async def delete_comment_service(
    comment_id: int,
    db: AsyncSession,
) -> None:
    try:
        comment = await db.get(Comment, comment_id)
        if not comment:
            raise CommentNotFoundException(comment_id)

        await db.delete(comment)
        await db.commit()
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "delete comment")
