from typing import List

from fastapi import APIRouter, Request, status

from app.auth.dependencies import UserDependency
from app.db.dependencies import DatabaseDependency
from app.follow.schemas import (
    FollowerResponse,
    FollowingResponse,
    FollowResponse,
    UserFollowStats,
)
from app.follow.service import (
    check_is_following_service,
    follow_user_service,
    get_follow_stats_service,
    get_followers_service,
    get_following_service,
    unfollow_user_service,
)
from app.limiter import limiter

router = APIRouter()


@router.post(
    "/users/{username}/follow",
    response_model=FollowResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("30/hour")
async def follow_user(
    request: Request, username: str, user: UserDependency, db: DatabaseDependency
):
    return await follow_user_service(user, username, db)


@router.delete("/users/{username}/follow", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/hour")
async def unfollow_user(
    request: Request, username: str, user: UserDependency, db: DatabaseDependency
):
    await unfollow_user_service(user, username, db)


@router.get("/users/{username}/followers", response_model=List[FollowerResponse])
@limiter.limit("60/minute")
async def get_followers(request: Request, username: str, db: DatabaseDependency):
    return await get_followers_service(username, db)


@router.get("/users/{username}/following", response_model=List[FollowingResponse])
@limiter.limit("60/minute")
async def get_following(request: Request, username: str, db: DatabaseDependency):
    return await get_following_service(username, db)


@router.get("/users/{username}/follow-stats", response_model=UserFollowStats)
@limiter.limit("100/minute")
async def get_follow_stats(request: Request, username: str, db: DatabaseDependency):
    return await get_follow_stats_service(username, db)


@router.get("/users/{username}/is-following", response_model=bool)
@limiter.limit("100/minute")
async def check_is_following(
    request: Request, username: str, user: UserDependency, db: DatabaseDependency
):
    return await check_is_following_service(user, username, db)
