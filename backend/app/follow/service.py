from typing import List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.auth.models import User
from app.follow.models import UserFollow
from app.follow.schemas import (
    FollowResponse,
    UserFollowStats,
    FollowerResponse,
    FollowingResponse
)


async def follow_user_service(
    current_user: User,
    target_username: str,
    db: AsyncSession
) -> FollowResponse:
    target_user = await db.get(User, target_username)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{target_username}' not found"
        )

    if current_user.username == target_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )

    stmt = select(UserFollow).where(
        UserFollow.follower_username == current_user.username,
        UserFollow.following_username == target_username
    )
    existing_follow = await db.scalar(stmt)

    if existing_follow:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Already following user '{target_username}'"
        )

    follow = UserFollow(
        follower_username=current_user.username,
        following_username=target_username
    )
    db.add(follow)
    await db.commit()
    await db.refresh(follow)

    return FollowResponse.model_validate(follow)


async def unfollow_user_service(
    current_user: User,
    target_username: str,
    db: AsyncSession
) -> None:
    stmt = select(UserFollow).where(
        UserFollow.follower_username == current_user.username,
        UserFollow.following_username == target_username
    )
    follow = await db.scalar(stmt)

    if not follow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Not following user '{target_username}'"
        )

    await db.delete(follow)
    await db.commit()


async def get_followers_service(
    username: str,
    db: AsyncSession
) -> List[FollowerResponse]:
    user = await db.get(User, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{username}' not found"
        )

    stmt = (
        select(UserFollow, User)
        .join(User, User.username == UserFollow.follower_username)
        .where(UserFollow.following_username == username)
        .order_by(UserFollow.created_at.desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    followers = []
    for follow, follower_user in rows:
        followers.append(
            FollowerResponse(
                username=follower_user.username,
                first_name=follower_user.first_name,
                last_name=follower_user.last_name,
                email=follower_user.email,
                followed_at=follow.created_at
            )
        )

    return followers


async def get_following_service(
    username: str,
    db: AsyncSession
) -> List[FollowingResponse]:
    user = await db.get(User, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{username}' not found"
        )

    stmt = (
        select(UserFollow, User)
        .join(User, User.username == UserFollow.following_username)
        .where(UserFollow.follower_username == username)
        .order_by(UserFollow.created_at.desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    following = []
    for follow, following_user in rows:
        following.append(
            FollowingResponse(
                username=following_user.username,
                first_name=following_user.first_name,
                last_name=following_user.last_name,
                email=following_user.email,
                followed_at=follow.created_at
            )
        )

    return following


async def get_follow_stats_service(
    username: str,
    db: AsyncSession
) -> UserFollowStats:
    user = await db.get(User, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{username}' not found"
        )

    follower_stmt = select(func.count()).select_from(UserFollow).where(
        UserFollow.following_username == username
    )
    follower_count = await db.scalar(follower_stmt) or 0

    following_stmt = select(func.count()).select_from(UserFollow).where(
        UserFollow.follower_username == username
    )
    following_count = await db.scalar(following_stmt) or 0

    return UserFollowStats(
        username=username,
        follower_count=follower_count,
        following_count=following_count
    )


async def check_is_following_service(
    current_user: User,
    target_username: str,
    db: AsyncSession
) -> bool:
    stmt = select(func.count()).select_from(UserFollow).where(
        UserFollow.follower_username == current_user.username,
        UserFollow.following_username == target_username
    )
    count = await db.scalar(stmt) or 0
    return count > 0
