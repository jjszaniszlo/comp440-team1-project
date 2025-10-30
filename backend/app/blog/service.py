from datetime import date
from typing import List
from app.auth.models import User
from app.blog.models import Blog, Tag, blog_tag_table
from app.blog.schemas import (
    BlogEditRequest,
    BlogResponse,
    BlogDetailResponse,
)
from app.blog.exceptions import handle_database_error, BlogNotFoundException

from sqlalchemy import Select, select, delete, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import NoResultFound

from app.blog.types import BlogSortBy, BlogSortOrder, BlogStatus
from app.user.models import UserDailyActivity


async def create_blog_service(
    user: User,
    db: AsyncSession,
) -> BlogResponse:
    try:
        new_blog = Blog(
            author=user,
        )
        db.add(new_blog)
        await db.commit()
        await db.refresh(new_blog)

        activity = await db.scalar(
            select(UserDailyActivity).filter_by(
                username=user.username, activity_date=date.today()
            )
        )

        if activity:
            activity.blogs_made += 1
            db.add(activity)
            await db.commit()
            await db.refresh(activity)

        return BlogResponse.model_validate(new_blog)
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "create blog")


async def list_blogs_service(
    user: User,
    db: AsyncSession,
) -> list[BlogResponse]:
    try:
        result = await db.scalars(
            select(Blog).where(Blog.author_username == user.username)
        )
        blogs = result.all()
        return [BlogResponse.model_validate(blog) for blog in blogs]
    except Exception as e:
        handle_database_error(e, "list blogs")


async def get_blog_service(
    blog_id: int,
    db: AsyncSession,
) -> BlogDetailResponse:
    try:
        result = await db.scalars(
            select(Blog).where(Blog.id == blog_id).options(selectinload(Blog.tags))
        )
        blog = result.one()
        return BlogDetailResponse.model_validate(blog)
    except NoResultFound:
        raise BlogNotFoundException(blog_id)
    except Exception as e:
        handle_database_error(e, "get blog")


def blog_apply_sorting(
    query: Select, sort: BlogSortBy, sort_order: BlogSortOrder
) -> Select:
    sort_column = {
        BlogSortBy.CREATED_AT: Blog.created_at,
        BlogSortBy.UPDATED_AT: Blog.updated_at,
        BlogSortBy.SUBJECT: Blog.subject,
    }[sort]

    if sort_order == BlogSortOrder.ASC:
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return query


async def search_blogs_service(
    db: AsyncSession,
    search: str,
    tag_names: List[str],
    tag_match_all: bool,
    authors: List[str],
    sort_by: BlogSortBy,
    sort_order: BlogSortOrder,
) -> List[BlogResponse]:
    try:
        if search:
            relevance_expr = text(
                "MATCH(subject, description, content) AGAINST(:search_term IN NATURAL LANGUAGE MODE) AS relevance"
            ).bindparams(search_term=search)

            query = (
                select(Blog, relevance_expr)
                .where(Blog.status == BlogStatus.PUBLISHED.value)
                .where(
                    text(
                        "MATCH(subject, description, content) AGAINST(:search_term IN NATURAL LANGUAGE MODE) > 0"
                    ).bindparams(search_term=search)
                )
            )
        else:
            query = select(Blog).where(Blog.status == BlogStatus.PUBLISHED)

        if tag_names:
            query = query.join(Blog.tags).where(Tag.name.in_(tag_names))
            if tag_match_all:
                query = query.group_by(Blog.id).having(
                    func.count(Tag.id) == len(tag_names)
                )
            else:
                query = query.distinct()

        if authors:
            query = query.where(Blog.author_username.in_(authors))

        if search:
            sort = "relevance desc"
            sort2 = f"{sort_by.value} {sort_order.value}"
            query = query.order_by(text(sort), text(sort2))
        else:
            sort = f"{sort_by.value} {sort_order.value}"
            query = query.order_by(text(sort))

        result = await db.execute(query)

        if search:
            blogs = [row[0] for row in result.all()]
        else:
            blogs = result.scalars().all()

        return [BlogResponse.model_validate(blog) for blog in blogs]
    except Exception as e:
        handle_database_error(e, "search blogs")


async def publish_or_delist_blog_service(
    blog_id: int, db: AsyncSession, publish: bool
) -> BlogResponse:
    try:
        result = await db.scalars(select(Blog).where(Blog.id == blog_id))
        blog = result.one()
        if publish:
            blog.status = BlogStatus.PUBLISHED
        else:
            blog.status = BlogStatus.DRAFT
        db.add(blog)
        await db.commit()
        await db.refresh(blog)
        return BlogResponse.model_validate(blog)
    except NoResultFound:
        await db.rollback()
        raise BlogNotFoundException(blog_id)
    except Exception as e:
        await db.rollback()
        handle_database_error(e, publish and "publish blog" or "delist blog")


async def get_or_create_tag(tag_name: str, db: AsyncSession) -> Tag:
    result = await db.scalars(select(Tag).where(Tag.name == tag_name))
    tag = result.first()

    if not tag:
        tag = Tag(name=tag_name)
        db.add(tag)
        await db.flush()

    return tag


async def cleanup_orphaned_tags(db: AsyncSession) -> None:
    orphaned_tags_query = (
        select(Tag.id)
        .outerjoin(blog_tag_table, Tag.id == blog_tag_table.c.tag_id)
        .where(blog_tag_table.c.blog_id.is_(None))
    )

    result = await db.scalars(orphaned_tags_query)
    orphaned_tag_ids = result.all()

    if orphaned_tag_ids:
        await db.execute(delete(Tag).where(Tag.id.in_(orphaned_tag_ids)))


async def update_blog_service(
    blog_id: int,
    blog_edit: BlogEditRequest,
    db: AsyncSession,
) -> BlogDetailResponse:
    try:
        result = await db.scalars(
            select(Blog).where(Blog.id == blog_id).options(selectinload(Blog.tags))
        )
        blog = result.one()

        blog.subject = blog_edit.subject or blog.subject
        blog.description = blog_edit.description or blog.description
        blog.content = blog_edit.content or blog.content

        if blog_edit.tags is not None:
            new_tags = []
            for tag_name in blog_edit.tags:
                tag = await get_or_create_tag(tag_name, db)
                new_tags.append(tag)

            blog.tags = new_tags

        db.add(blog)
        await db.commit()

        if blog_edit.tags is not None:
            await cleanup_orphaned_tags(db)
            await db.commit()

        await db.refresh(blog, attribute_names=["tags"])

        return BlogDetailResponse.model_validate(blog)
    except NoResultFound:
        await db.rollback()
        raise BlogNotFoundException(blog_id)
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "update blog")


async def delete_blog_service(
    blog: Blog,
    db: AsyncSession,
):
    try:
        await remove_tags_from_blog_service(blog.id, [], db)
        await db.delete(blog)
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise e


async def add_tags_to_blog_service(
    blog_id: int,
    tag_names: list[str],
    db: AsyncSession,
) -> BlogDetailResponse:
    try:
        result = await db.scalars(
            select(Blog).where(Blog.id == blog_id).options(selectinload(Blog.tags))
        )
        blog = result.one()

        existing_tag_names = {tag.name for tag in blog.tags}

        for tag_name in tag_names:
            if tag_name not in existing_tag_names:
                tag = await get_or_create_tag(tag_name, db)
                blog.tags.append(tag)

        db.add(blog)
        await db.commit()
        await db.refresh(blog, attribute_names=["tags"])

        return BlogDetailResponse.model_validate(blog)
    except NoResultFound:
        await db.rollback()
        raise BlogNotFoundException(blog_id)
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "add tags to blog")


async def remove_tags_from_blog_service(
    blog_id: int,
    tag_names: list[str],
    db: AsyncSession,
) -> BlogDetailResponse:
    try:
        result = await db.scalars(
            select(Blog).where(Blog.id == blog_id).options(selectinload(Blog.tags))
        )
        blog = result.one()

        tag_names_set = set(tag_names)
        blog.tags = [tag for tag in blog.tags if tag.name not in tag_names_set]

        db.add(blog)
        await db.commit()

        await cleanup_orphaned_tags(db)
        await db.commit()

        await db.refresh(blog, attribute_names=["tags"])

        return BlogDetailResponse.model_validate(blog)
    except NoResultFound:
        await db.rollback()
        raise BlogNotFoundException(blog_id)
    except Exception as e:
        await db.rollback()
        handle_database_error(e, "remove tags from blog")
