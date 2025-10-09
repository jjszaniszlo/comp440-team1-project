from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import UserDependency
from app.blog.models import Blog
from app.db.dependencies import DatabaseDependency

async def get_user_blog(
    blog_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Blog:
    blog = await db.get(Blog, blog_id)

    if not blog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blog not found"
        )

    if blog.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this blog"
        )

    return blog

UserBlogDependency = Annotated[Blog, Depends(get_user_blog)]