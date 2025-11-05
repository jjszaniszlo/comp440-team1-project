from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select

from app.auth.dependencies import UserDependency
from app.comment.models import Comment
from app.db.dependencies import DatabaseDependency
from app.user.models import UserDailyActivity, UserLimits


async def get_user_comment(
    comment_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Comment:
    comment = await db.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    if comment.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this comment",
        )

    return comment


async def get_user_blog_comment(
    blog_id: int,
    comment_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Comment:
    comment = await db.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found"
        )

    if comment.blog_id != blog_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} does not belong to blog {blog_id}",
        )

    if comment.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this comment",
        )

    return comment


async def create_activity_record(username: str, db: DatabaseDependency):
    today = date.today()
    activity = UserDailyActivity(
        username=username, activity_date=today, comments_made=0, blogs_made=0
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def can_create_comment(user: UserDependency, db: DatabaseDependency):
    today = date.today()
    limits_query = select(UserLimits).filter_by(username=user.username)
    limits = await db.scalar(limits_query)

    if not limits:
        raise Exception("User limits not found")

    activity_query = select(UserDailyActivity).filter_by(
        username=user.username, activity_date=today
    )
    activity = await db.scalar(activity_query)

    if not activity:
        await create_activity_record(user.username, db)
    else:
        if activity.comments_made >= limits.comment_creation_limit:
            raise HTTPException(
                status_code=403, detail="Comment creation limit reached"
            )


UserCommentDependency = Annotated[Comment, Depends(get_user_comment)]
UserBlogCommentDependency = Annotated[Comment, Depends(get_user_blog_comment)]
CanCommentDependency = Annotated[None, Depends(can_create_comment)]
