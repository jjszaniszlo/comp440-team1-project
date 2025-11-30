import asyncio
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.models import User
from app.auth.security import hash_password
from app.blog.models import Blog, Tag
from app.blog.types import BlogStatus
from app.comment.models import Comment, Sentiment
from app.config import settings
from app.follow.models import UserFollow  # Import to ensure proper relationship setup
from app.user.models import UserDailyActivity, UserLimits
from app.utils.phone import normalize_phone_number


def random_date_in_range(start_date: datetime, end_date: datetime) -> datetime:
    time_delta = end_date - start_date

    if time_delta.total_seconds() <= 0:
        return start_date

    if time_delta.days == 0:
        random_seconds = random.randint(0, int(time_delta.total_seconds()))
        return start_date + timedelta(seconds=random_seconds)

    random_days = random.randint(0, time_delta.days)
    random_seconds = random.randint(0, 86400)  # Seconds in a day
    return start_date + timedelta(days=random_days, seconds=random_seconds)


def get_five_years_ago() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=5 * 365)


def get_now() -> datetime:
    return datetime.now(timezone.utc)


async def get_or_create_tag(
    db: AsyncSession, tag_name: str, created_at: datetime
) -> Tag:
    result = await db.execute(select(Tag).where(Tag.name == tag_name))
    tag = result.scalar_one_or_none()

    if not tag:
        tag = Tag(name=tag_name, created_at=created_at)
        db.add(tag)
        await db.flush()

    return tag


async def create_comment(
    db: AsyncSession,
    comment_data: Dict[str, Any],
    blog_id: int,
    blog_author: str,
    parent_id: Optional[int],
    min_date: datetime,
) -> Comment:
    now = get_now()
    comment_created_at = random_date_in_range(min_date, now)

    comment = Comment(
        content=comment_data["content"],
        sentiment=Sentiment(comment_data["sentiment"]),
        blog_id=blog_id,
        author_username=comment_data["author_username"],
        parent_comment_id=parent_id,
        created_at=comment_created_at,
        updated_at=comment_created_at,
    )

    db.add(comment)
    await db.flush()

    if "replies" in comment_data and comment_data["replies"]:
        for reply_data in comment_data["replies"]:
            await create_comment(
                db=db,
                comment_data=reply_data,
                blog_id=blog_id,
                blog_author=blog_author,
                parent_id=comment.id,
                min_date=comment_created_at,
            )

    return comment


async def seed_database():
    print("🌱 Starting database seeding...")

    script_dir = Path(__file__).parent
    mock_data_path = script_dir / "blog_platform_mock_data.json"

    if not mock_data_path.exists():
        print(f"❌ Error: Mock data file not found at {mock_data_path}")
        return

    print(f"📖 Loading mock data from {mock_data_path}")
    with open(mock_data_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    engine = create_async_engine(str(settings.DB_URL), echo=False)
    async_session = async_sessionmaker(
        bind=engine, expire_on_commit=False, class_=AsyncSession
    )

    async with async_session() as db:
        user_creation_dates: Dict[str, datetime] = {}
        five_years_ago = get_five_years_ago()
        now = get_now()

        print(f"\n👥 Seeding {len(data['users'])} users...")
        used_phones = set()
        used_emails = set()

        async with db.begin():
            for i, user_data in enumerate(data["users"], 1):
                result = await db.execute(
                    select(User).where(User.username == user_data["username"])
                )
                existing_user = result.scalar_one_or_none()

                if existing_user:
                    user_creation_dates[user_data["username"]] = five_years_ago
                    if i % 10 == 0:
                        print(f"  ⏭ Skipped existing user {i}/{len(data['users'])}")
                    continue

                user_created_at = random_date_in_range(five_years_ago, now)
                user_creation_dates[user_data["username"]] = user_created_at

                hashed_password = hash_password(user_data["password"])

                email = user_data["email"]
                base_email = email
                attempt = 0
                while email in used_emails:
                    if "@" in base_email:
                        local, domain = base_email.split("@", 1)
                        email = f"{local}+{attempt + 1}@{domain}"
                    else:
                        email = f"{base_email}{attempt + 1}"
                    attempt += 1

                used_emails.add(email)

                try:
                    normalized_phone = normalize_phone_number(user_data["phoneNumber"])
                except ValueError:
                    normalized_phone = f"+1.555{str(i).zfill(7)}"

                base_phone = normalized_phone
                attempt = 0
                while normalized_phone in used_phones:
                    if "." in base_phone:
                        country_code, number = base_phone.split(".", 1)
                        unique_number = str(int(number) + attempt + 1).zfill(
                            len(number)
                        )
                        normalized_phone = f"{country_code}.{unique_number}"
                    else:
                        normalized_phone = f"+1.{str(5550000000 + i + attempt)}"
                    attempt += 1

                used_phones.add(normalized_phone)

                user = User(
                    username=user_data["username"],
                    hashed_password=hashed_password,
                    email=email,
                    phone=normalized_phone,
                    first_name=user_data["firstName"],
                    last_name=user_data["lastName"],
                )

                result = await db.execute(
                    select(UserLimits).where(
                        UserLimits.username == user_data["username"]
                    )
                )
                existing_limits = result.scalar_one_or_none()

                if not existing_limits:
                    user_limits = UserLimits(
                        username=user_data["username"],
                        comment_creation_limit=settings.DEFAULT_COMMENT_LIMIT,
                        blog_creation_limit=settings.DEFAULT_BLOG_LIMIT,
                    )
                    db.add(user_limits)

                db.add(user)

                if i % 10 == 0:
                    print(f"  ✓ Processed {i}/{len(data['users'])} users")

        print(f"✅ Successfully seeded {len(data['users'])} users")

        print(f"\n📝 Seeding {len(data['blogs'])} blogs...")
        blog_creation_dates: Dict[int, datetime] = {}

        async with db.begin():
            for i, blog_data in enumerate(data["blogs"], 1):
                result = await db.execute(
                    select(Blog).where(Blog.subject == blog_data["subject"])
                )
                existing_blog = result.scalar_one_or_none()

                if existing_blog:
                    if i % 20 == 0:
                        print(f"  ⏭ Skipped existing blog {i}/{len(data['blogs'])}")
                    continue

                author_username = blog_data["author_username"]

                user_created = user_creation_dates[author_username]
                blog_created_at = random_date_in_range(user_created, now)

                blog = Blog(
                    subject=blog_data["subject"],
                    description=blog_data["description"],
                    content=blog_data["content"],
                    status=BlogStatus.PUBLISHED,
                    author_username=author_username,
                    upvotes=0,
                    downvotes=0,
                    created_at=blog_created_at,
                    updated_at=blog_created_at,
                )

                blog.tags = []

                db.add(blog)
                await db.flush()

                blog_creation_dates[blog.id] = blog_created_at

                async with db.begin_nested():
                    unique_tag_names = list(set(blog_data["tags"]))

                    tags_to_add = []
                    for tag_name in unique_tag_names:
                        tag_created_at = random_date_in_range(
                            five_years_ago, blog_created_at
                        )
                        tag = await get_or_create_tag(db, tag_name, tag_created_at)
                        tags_to_add.append(tag)

                    blog.tags.extend(tags_to_add)

                async with db.begin_nested():
                    for comment_data in blog_data["comments"]:
                        await create_comment(
                            db=db,
                            comment_data=comment_data,
                            blog_id=blog.id,
                            blog_author=author_username,
                            parent_id=None,
                            min_date=blog_created_at,
                        )

                if i % 20 == 0:
                    print(f"  ✓ Created {i}/{len(data['blogs'])} blogs")

        print(f"✅ Successfully seeded {len(data['blogs'])} blogs")

        # Create follow relationships
        print("\n👥 Creating follow relationships...")
        usernames = list(user_creation_dates.keys())
        follows_created = 0

        async with db.begin():
            # Create various follow scenarios
            for i, follower in enumerate(usernames):
                # Each user follows some other users
                # Use deterministic selection based on index for reproducibility
                num_to_follow = (i % 5) + 1  # Follow 1-5 users

                # Select users to follow (skip self)
                potential_followees = [u for u in usernames if u != follower]

                # Deterministically select who to follow based on user index
                random.seed(hash(follower))  # Reproducible randomness per user
                followees = random.sample(
                    potential_followees,
                    min(num_to_follow, len(potential_followees))
                )

                for following in followees:
                    # Check if follow relationship already exists
                    result = await db.execute(
                        select(UserFollow).where(
                            UserFollow.follower_username == follower,
                            UserFollow.following_username == following,
                        )
                    )
                    existing_follow = result.scalar_one_or_none()

                    if not existing_follow:
                        # Follow created after both users exist
                        follower_created = user_creation_dates[follower]
                        following_created = user_creation_dates[following]
                        min_follow_date = max(follower_created, following_created)
                        follow_created_at = random_date_in_range(min_follow_date, now)

                        follow = UserFollow(
                            follower_username=follower,
                            following_username=following,
                            created_at=follow_created_at,
                        )
                        db.add(follow)
                        follows_created += 1

            # Reset random seed
            random.seed()

        print(f"✅ Successfully created {follows_created} follow relationships")

        print("\n" + "=" * 60)
        print("🎉 Database seeding completed successfully!")
        print("=" * 60)
        print(f"Users created: {len(data['users'])}")
        print(f"Blogs created: {len(data['blogs'])}")

        total_comments = 0
        for blog_data in data["blogs"]:

            def count_comments(comments):
                count = len(comments)
                for comment in comments:
                    if "replies" in comment and comment["replies"]:
                        count += count_comments(comment["replies"])
                return count

            total_comments += count_comments(blog_data["comments"])

        print(f"Comments created: {total_comments}")

        unique_tags = set()
        for blog_data in data["blogs"]:
            unique_tags.update(blog_data["tags"])
        print(f"Unique tags created: {len(unique_tags)}")
        print(f"Follow relationships created: {follows_created}")
        print("=" * 60)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
