from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select

from app.auth.dependencies import UserDependency
from app.blog.models import Blog
from app.db.dependencies import DatabaseDependency
from app.user.models import UserDailyActivity, UserLimits


async def create_activity_record(username: str, db: DatabaseDependency):
    today = date.today()
    activity = UserDailyActivity(
        username=username, activity_date=today, comments_made=0, blogs_made=0
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def get_user_blog(
    blog_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Blog:
    blog = await db.get(Blog, blog_id)

    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Blog not found"
        )

    if blog.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this blog",
        )

    return blog


async def can_create_blog(user: UserDependency, db: DatabaseDependency):
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
        if activity.blogs_made >= limits.blog_creation_limit:
            raise HTTPException(status_code=403, detail="Blog creation limit reached")


UserAuthorizedOwnedBlog = Annotated[Blog, Depends(get_user_blog)]
UserCanCreateBlogDependency = Annotated[None, Depends(can_create_blog)]
