from typing import List

from fastapi import APIRouter, Request

from app.auth.dependencies import UserDependency
from app.db.dependencies import DatabaseDependency
from app.limiter import limiter
from app.user.schemas import (
    UserCommentResponse,
    UserPrivateProfileResponse,
    UserPublicProfileResponse,
)
from app.user.service import (
    get_private_profile_service,
    get_public_profile_service,
    get_user_comments_service,
)

router = APIRouter()


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
