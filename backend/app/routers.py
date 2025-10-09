from fastapi import APIRouter

from app.auth.router import router as auth_router
from app.blog.router import router as blog_router
from app.comment.router import router as comment_router
from app.follow.router import router as follow_router


api_router = APIRouter()


api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(blog_router, prefix="/blog", tags=["blog"])
api_router.include_router(comment_router, prefix="/blog", tags=["comments"])
api_router.include_router(follow_router, prefix="/follow", tags=["follow"])