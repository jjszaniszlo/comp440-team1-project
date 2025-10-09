from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FollowResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    follower_username: str
    following_username: str
    created_at: datetime


class UserFollowStats(BaseModel):
    username: str
    follower_count: int
    following_count: int


class FollowerResponse(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    followed_at: datetime


class FollowingResponse(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    followed_at: datetime
