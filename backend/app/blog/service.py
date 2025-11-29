from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Select, delete, func, select, text, and_, case
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.auth.models import User
from app.blog.exceptions import BlogNotFoundException, handle_database_error
from app.blog.models import Blog, Tag, blog_tag_table
from app.blog.schemas import (
    BlogDetailResponse,
    BlogEditRequest,
    BlogResponse,
    BlogSearchResponse,
    UserLiteResponse,
    UserQueryParams,
)
from app.blog.types import BlogSortBy, BlogSortOrder, BlogStatus
from app.schemas import PaginatedResponse, PaginationMeta
from app.user.models import UserDailyActivity
from app.follow.models import UserFollow
from app.comment.models import Comment, Sentiment


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
    all_positive_comments: bool,
    sort_by: BlogSortBy,
    sort_order: BlogSortOrder,
    page: int = 1,
    size: int = 20,
) -> PaginatedResponse[BlogSearchResponse]:
    try:
        boolean_search = None
        if search:
            search_words = search.strip().split()
            boolean_search = " ".join(f"{word}*" for word in search_words)

        base_query = select(Blog).where(Blog.status == BlogStatus.PUBLISHED)

        if search:
            base_query = base_query.where(
                text(
                    "MATCH(subject, description, content) AGAINST(:search_term IN BOOLEAN MODE)"
                ).bindparams(search_term=boolean_search)
            )

        if tag_names:
            base_query = base_query.join(Blog.tags).where(Tag.name.in_(tag_names))
            if tag_match_all:
                base_query = base_query.group_by(Blog.id).having(
                    func.count(Tag.id.distinct()) == len(tag_names)
                )
            else:
                base_query = base_query.distinct()

        if authors:
            base_query = base_query.where(Blog.author_username.in_(authors))

        if all_positive_comments:
            blogs_with_negative_comments = (
                select(Comment.blog_id)
                .where(Comment.sentiment != Sentiment.POSITIVE)
                .distinct()
            )

            blogs_with_comments = (
                select(Comment.blog_id).distinct()
            )
            
            base_query = base_query.where(
                and_(
                    Blog.id.in_(blogs_with_comments),
                    Blog.id.notin_(blogs_with_negative_comments)
                )
            )

        if tag_names and tag_match_all:
            count_query = select(func.count(func.distinct(Blog.id))).select_from(
                base_query.alias()
            )
        else:
            count_query = select(func.count()).select_from(base_query.alias())

        main_query = base_query

        if search and sort_by == BlogSortBy.RELEVANCE:
            main_query = main_query.add_columns(
                text(
                    "MATCH(subject, description, content) AGAINST(:search_term IN BOOLEAN MODE) AS relevance"
                ).bindparams(search_term=boolean_search)
            )
            main_query = main_query.order_by(text("relevance DESC"))
            main_query = main_query.options(selectinload(Blog.tags))
        elif search:
            main_query = main_query.add_columns(
                text(
                    "MATCH(subject, description, content) AGAINST(:search_term IN BOOLEAN MODE) AS relevance"
                ).bindparams(search_term=boolean_search)
            )
            main_query = blog_apply_sorting(main_query, sort_by, sort_order)
            main_query = main_query.options(selectinload(Blog.tags))
        else:
            if sort_by == BlogSortBy.RELEVANCE:
                main_query = blog_apply_sorting(main_query, BlogSortBy.CREATED_AT, BlogSortOrder.DESC)
            else:
                main_query = blog_apply_sorting(main_query, sort_by, sort_order)
            main_query = main_query.options(joinedload(Blog.tags))

        offset = (page - 1) * size
        main_query = main_query.offset(offset).limit(size)

        total = await db.scalar(count_query) or 0
        result = await db.execute(main_query)

        if search and sort_by == BlogSortBy.RELEVANCE:
            blogs = [row[0] for row in result.all()]
        elif search:
            blogs = [row[0] for row in result.all()]
        else:
            blogs = result.scalars().unique().all()

        items = [BlogSearchResponse.model_validate(blog) for blog in blogs]

        pages = (total + size - 1) // size if total > 0 else 1

        meta = PaginationMeta(
            page=page,
            size=size,
            total=total,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1,
        )

        return PaginatedResponse(items=items, meta=meta)
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

# Searches for users based on various criteria (Phase 3 support)
async def search_users_service(
    db: AsyncSession,
    params: UserQueryParams,
) -> List[UserLiteResponse]:

    try:
        # Parse date if provided as string
        search_date = None
        if params.date:
            try:
                search_date = datetime.strptime(params.date, "%Y-%m-%d").date()
            except ValueError:
                return []
        # Case to return users whose blogs have no negative comments
        if params.no_negative_comments_on_blogs:
            users_with_blogs = select(Blog.author_username).distinct()

            users_with_negative_comments_on_blogs = (
                select(Blog.author_username)
                .join(Comment, Comment.blog_id == Blog.id)
                .where(Comment.sentiment == Sentiment.NEGATIVE)
                .distinct()
            )

            query = (
                select(User.username)
                .where(
                    and_(
                        User.username.in_(users_with_blogs),
                        User.username.notin_(users_with_negative_comments_on_blogs)
                    )
                )
            )
            
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]
        
        # Case to return users who posted comments but all are negative
        if params.all_negative_comments:
            users_with_comments = select(Comment.author_username).distinct()
            
            users_with_positive_comments = (
                select(Comment.author_username)
                .where(Comment.sentiment == Sentiment.POSITIVE)
                .distinct()
            )
            
            query = (
                select(User.username)
                .where(
                    and_(
                        User.username.in_(users_with_comments),
                        User.username.notin_(users_with_positive_comments)
                    )
                )
            )
            
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]
        
        # Case to return users who have never posted a blog
        if params.never_posted_blog:
            users_with_blogs_subquery = select(Blog.author_username).distinct()
            query = select(User.username).where(User.username.notin_(users_with_blogs_subquery))
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case to return users followed by both users x and users y
        if len(params.followed_by) > 0:
            # Start with users followed by the first user
            query = select(UserFollow.following_username).where(
                UserFollow.follower_username == params.followed_by[0]
            )
            
            # For each additional user, intersect with their following list
            for follower in params.followed_by[1:]:
                followed_by_subquery = select(UserFollow.following_username).where(
                    UserFollow.follower_username == follower
                )
                query = query.where(UserFollow.following_username.in_(followed_by_subquery))
            
            query = query.distinct()
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in sorted(usernames)]

        # Case: Most blogs on a specific date
        if search_date:
            result = await db.execute(
                select(UserDailyActivity.username, UserDailyActivity.blogs_made)
                .where(UserDailyActivity.activity_date == search_date)
            )
            rows = result.fetchall()
            
            if not rows:
                return []
            
            max_count = max(row[1] for row in rows)
            usernames = sorted([row[0] for row in rows if row[1] == max_count])
            return [UserLiteResponse(username=u) for u in usernames]

        # Case: Users who posted blogs with both tags on the same day
        if len(params.tags) > 0:
            if params.same_day_tags:
                # Users who posted all tags on the same day
                query = (
                    select(Blog.author_username)
                    .distinct()
                    .join(blog_tag_table, Blog.id == blog_tag_table.c.blog_id)
                    .join(Tag, Tag.id == blog_tag_table.c.tag_id)
                    .where(Tag.name.in_([tag.strip() for tag in params.tags]))
                    .group_by(Blog.author_username, func.date(Blog.created_at))
                    .having(
                        and_(
                            func.count(func.distinct(Tag.name)) == len(params.tags),
                            func.count(func.distinct(Blog.id)) >= len(params.tags),
                        )
                    )
                )
            else:
                # Users who have used all tags (not necessarily same day)
                query = (
                    select(Blog.author_username)
                    .join(blog_tag_table, Blog.id == blog_tag_table.c.blog_id)
                    .join(Tag, Tag.id == blog_tag_table.c.tag_id)
                    .where(Tag.name.in_(params.tags))
                    .group_by(Blog.author_username)
                    .having(func.count(func.distinct(Tag.name)) == len(params.tags))
                )
            
            result = await db.scalars(query)
            usernames = result.all()
            return [UserLiteResponse(username=u) for u in usernames]

        # No valid query parameters provided
        return []

    except Exception as e:
        handle_database_error(e, "search users")
        return []

