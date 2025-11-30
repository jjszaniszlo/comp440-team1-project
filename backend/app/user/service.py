from datetime import datetime
from typing import List

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.blog.models import Blog, Tag, blog_tag_table
from app.comment.models import Comment, Sentiment
from app.follow.models import UserFollow
from app.user.models import UserDailyActivity
from app.user.schemas import (
    UserCommentResponse,
    UserLiteResponse,
    UserPrivateProfileResponse,
    UserPublicProfileResponse,
    UserQueryParams,
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


async def search_users_service(
    db: AsyncSession,
    params: UserQueryParams,
) -> List[UserLiteResponse]:
    try:
        # Parse date if provided as string
        search_date = None
        if params.date:
            try:
                search_date = datetime.strptime(params.date, "%Y-%m-%d").date()
            except ValueError:
                return []

        # Case to return users whose blogs have no negative comments
        if params.no_negative_comments_on_blogs:
            users_with_blogs = select(Blog.author_username).distinct()

            users_with_negative_comments_on_blogs = (
                select(Blog.author_username)
                .join(Comment, Comment.blog_id == Blog.id)
                .where(Comment.sentiment == Sentiment.NEGATIVE)
                .distinct()
            )

            query = select(User.username).where(
                and_(
                    User.username.in_(users_with_blogs),
                    User.username.notin_(users_with_negative_comments_on_blogs),
                )
            )

            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case to return users who posted comments but all are negative
        if params.all_negative_comments:
            users_with_comments = select(Comment.author_username).distinct()

            users_with_positive_comments = (
                select(Comment.author_username)
                .where(Comment.sentiment == Sentiment.POSITIVE)
                .distinct()
            )

            query = select(User.username).where(
                and_(
                    User.username.in_(users_with_comments),
                    User.username.notin_(users_with_positive_comments),
                )
            )

            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case to return users who have never posted a blog
        if params.never_posted_blog:
            users_with_blogs_subquery = select(Blog.author_username).distinct()
            query = select(User.username).where(
                User.username.notin_(users_with_blogs_subquery)
            )
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case to return users followed by both users x and users y
        if params.followed_by and len(params.followed_by) > 0:
            # Start with users followed by the first user
            query = select(UserFollow.following_username).where(
                UserFollow.follower_username == params.followed_by[0]
            )

            # For each additional user, intersect with their following list
            for follower in params.followed_by[1:]:
                followed_by_subquery = select(UserFollow.following_username).where(
                    UserFollow.follower_username == follower
                )
                query = query.where(
                    UserFollow.following_username.in_(followed_by_subquery)
                )

            query = query.distinct()
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case: Most blogs on a specific date
        if search_date:
            result = await db.execute(
                select(UserDailyActivity.username, UserDailyActivity.blogs_made).where(
                    UserDailyActivity.activity_date == search_date
                )
            )
            rows = result.fetchall()

            if not rows:
                return []

            max_count = max(row[1] for row in rows)
            usernames = sorted([row[0] for row in rows if row[1] == max_count])
            return [UserLiteResponse(username=u) for u in usernames]

        # Case: Users who posted blogs with both tags on the same day
        if params.tags and len(params.tags) > 0:
            if params.same_day_tags:
                # Users who posted all tags on the same day
                query = (
                    select(Blog.author_username)
                    .distinct()
                    .join(blog_tag_table, Blog.id == blog_tag_table.c.blog_id)
                    .join(Tag, Tag.id == blog_tag_table.c.tag_id)
                    .where(Tag.name.in_([tag.strip() for tag in params.tags]))
                    .group_by(Blog.author_username, func.date(Blog.created_at))
                    .having(
                        and_(
                            func.count(func.distinct(Tag.name)) == len(params.tags),
                            func.count(func.distinct(Blog.id)) >= len(params.tags),
                        )
                    )
                )
            else:
                # Users who have used all tags (not necessarily same day)
                query = (
                    select(Blog.author_username)
                    .join(blog_tag_table, Blog.id == blog_tag_table.c.blog_id)
                    .join(Tag, Tag.id == blog_tag_table.c.tag_id)
                    .where(Tag.name.in_(params.tags))
                    .group_by(Blog.author_username)
                    .having(func.count(func.distinct(Tag.name)) == len(params.tags))
                )

            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in usernames]

        # No valid query parameters provided
        return []

    except Exception:
        return []
