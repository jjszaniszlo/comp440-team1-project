from datetime import timedelta

from fastapi import HTTPException, status

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.auth.schemas import Token, UserLogin, UserSignup
from app.auth.security import create_access_token, hash_password, verify_password
from app.config import settings
from app.user.models import UserLimits


async def service_signup(db: AsyncSession, user: UserSignup) -> User:
    try:
        hashed_pwd = hash_password(user.password)

        new_user = User(
            username=user.username,
            hashed_password=hashed_pwd,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
        )
        user_limits = UserLimits(
            username=user.username,
            comment_creation_limit=settings.DEFAULT_COMMENT_LIMIT,
            blog_creation_limit=settings.DEFAULT_BLOG_LIMIT
        )
        db.add(new_user)
        db.add(user_limits)
        
        await db.commit()
        await db.refresh(new_user)
        await db.refresh(user_limits)

        return new_user
    except HTTPException:
        await db.rollback()
        raise
    except IntegrityError as e:
        await db.rollback()
        error_msg = str(e.orig).lower()

        if 'email' in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        elif 'phone' in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Phone number already registered"
            )
        elif 'username' in error_msg or 'primary key' in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this information already exists"
            )
    except ValueError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )


async def service_login(db: AsyncSession, user_credentials: UserLogin) -> Token:
    try:
        user = await db.get(User, user_credentials.username)
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username},
            expires_delta=access_token_expires
        )

        return Token(access_token=access_token, token_type="bearer")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during login: {str(e)}"
        )