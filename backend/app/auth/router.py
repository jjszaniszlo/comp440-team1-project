from fastapi import APIRouter, Request, status

from app.auth.dependencies import UserDependency
from app.auth.schemas import Token, UserLogin, UserResponse, UserSignup
from app.auth.service import service_login, service_signup
from app.db.dependencies import DatabaseDependency
from app.limiter import limiter

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def signup(request: Request, db: DatabaseDependency, user: UserSignup):
    return await service_signup(db, user)


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, db: DatabaseDependency, user_credentials: UserLogin):
    return await service_login(db, user_credentials)


@router.get("/me", response_model=UserResponse)
@limiter.limit("30/minute")
async def me(request: Request, current_user: UserDependency):
    return current_user


@router.get("/hello")
@limiter.limit("30/minute")
async def hello(request: Request, _: UserDependency):
    return {"message": "Hello, authenticated user!"}