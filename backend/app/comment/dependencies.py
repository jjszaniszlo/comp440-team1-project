from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import UserDependency
from app.comment.models import Comment
from app.db.dependencies import DatabaseDependency


async def get_user_comment(
    comment_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Comment:
    comment = await db.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this comment"
        )

    return comment


async def get_blog_comment(
    blog_id: int,
    comment_id: int,
    db: DatabaseDependency,
) -> Comment:
    comment = await db.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment.blog_id != blog_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} does not belong to blog {blog_id}"
        )

    return comment


async def get_user_blog_comment(
    blog_id: int,
    comment_id: int,
    user: UserDependency,
    db: DatabaseDependency,
) -> Comment:
    comment = await db.get(Comment, comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    if comment.blog_id != blog_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} does not belong to blog {blog_id}"
        )

    if comment.author_username != user.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this comment"
        )

    return comment


UserCommentDependency = Annotated[Comment, Depends(get_user_comment)]
BlogCommentDependency = Annotated[Comment, Depends(get_blog_comment)]
UserBlogCommentDependency = Annotated[Comment, Depends(get_user_blog_comment)]
