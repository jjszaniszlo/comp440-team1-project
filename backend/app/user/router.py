from typing import List, Optional

from fastapi import APIRouter, Query, Request

from app.auth.dependencies import UserDependency
from app.db.dependencies import DatabaseDependency
from app.limiter import limiter
from app.user.schemas import (
    UserCommentResponse,
    UserLiteResponse,
    UserPrivateProfileResponse,
    UserPublicProfileResponse,
    UserQueryParams,
)
from app.user.service import (
    get_private_profile_service,
    get_public_profile_service,
    get_user_comments_service,
    search_users_service,
)

router = APIRouter()


@router.get("/", response_model=List[UserLiteResponse])
@limiter.limit("60/minute")
async def search_users(
    request: Request,
    db: DatabaseDependency,
    tags: List[str] = Query(default=[], description="List of tags to filter by"),
    same_day_tags: bool = Query(
        default=False, description="Whether to require all tags on same day"
    ),
    date: Optional[str] = Query(
        default=None, description="Date to filter by (YYYY-MM-DD format)"
    ),
    followed_by: List[str] = Query(
        default=[],
        description="List of usernames - find users followed by ALL of these users",
    ),
    never_posted_blog: bool = Query(
        default=False, description="Return users who have never posted a blog"
    ),
    all_negative_comments: bool = Query(
        default=False,
        description="Return users who posted comments that are all negative",
    ),
    no_negative_comments_on_blogs: bool = Query(
        default=False,
        description="Return users whose blogs have no negative comments",
    ),
):
    params = UserQueryParams(
        tags=tags,
        same_day_tags=same_day_tags,
        date=date,
        followed_by=followed_by,
        never_posted_blog=never_posted_blog,
        all_negative_comments=all_negative_comments,
        no_negative_comments_on_blogs=no_negative_comments_on_blogs,
    )
    return await search_users_service(db, params)


@router.get("/me", response_model=UserPrivateProfileResponse)
@limiter.limit("60/minute")
async def get_my_profile(
    request: Request,
    user: UserDependency,
    db: DatabaseDependency,
):
    return await get_private_profile_service(user, db)


@router.get("/{username}", response_model=UserPublicProfileResponse)
@limiter.limit("100/minute")
async def get_user_profile(
    request: Request,
    username: str,
    db: DatabaseDependency,
):
    return await get_public_profile_service(username, db)


@router.get("/{username}/comments", response_model=List[UserCommentResponse])
@limiter.limit("60/minute")
async def get_user_comments(
    request: Request,
    username: str,
    db: DatabaseDependency,
):
    return await get_user_comments_service(username, db)
