from fastapi import Depends, HTTPException
from app.auth.dependencies import UserDependency
from app.db.dependencies import DatabaseDependency
from app.user.models import UserDailyActivity, UserLimits

from datetime import date

from sqlalchemy import select

from typing import Annotated


async def create_activity_record(
    username: str,
    db: DatabaseDependency
):
    today = date.today()
    activity = UserDailyActivity(
        username=username,
        activity_date=today,
        comments_made=0,
        blogs_made=0
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def can_create_comment(
    user: UserDependency,
    db: DatabaseDependency
):
    today = date.today()
    limits_query = select(UserLimits).filter_by(username=user.username)
    limits = await db.scalar(limits_query)

    if not limits:
        raise Exception("User limits not found")

    activity_query = select(UserDailyActivity).filter_by(
        username=user.username, activity_date=today)
    activity = await db.scalar(activity_query)

    if not activity:
        await create_activity_record(user.username, db)
    else:
        if activity.comments_made >= limits.comment_creation_limit:
            raise HTTPException(
                status_code=403, detail="Comment creation limit reached")


async def can_create_blog(
    user: UserDependency,
    db: DatabaseDependency
):
    today = date.today()
    limits_query = select(UserLimits).filter_by(username=user.username)
    limits = await db.scalar(limits_query)

    if not limits:
        raise Exception("User limits not found")

    activity_query = select(UserDailyActivity).filter_by(
        username=user.username, activity_date=today)
    activity = await db.scalar(activity_query)

    if not activity:
        await create_activity_record(user.username, db)
    else:
        if activity.blogs_made >= limits.blog_creation_limit:
            raise HTTPException(
                status_code=403, detail="Blog creation limit reached")


CanCommentDependency = Annotated[None, Depends(can_create_comment)]
CanCreateBlogDependency = Annotated[None, Depends(can_create_blog)]
