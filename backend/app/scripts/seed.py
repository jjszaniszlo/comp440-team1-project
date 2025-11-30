import asyncio
import json
import random
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from sqlalchemy import func, select
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

    # Use fixed seed for reproducible data generation
    random.seed(42)

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

        # 50 blogs over 10 days - multiple blogs per day (avg 5 per day)
        num_days = 10
        date_pool = [
            now - timedelta(days=num_days - i)
            for i in range(num_days)
        ]

        # Pre-compute which users have multiple blogs to ensure same-day assignment
        user_blog_indices: Dict[str, list] = defaultdict(list)
        for i, blog_data in enumerate(data["blogs"]):
            user_blog_indices[blog_data["author_username"]].append(i)

        # Pre-assign dates: users with 2 blogs get both on the same day
        blog_date_assignments: Dict[int, datetime] = {}
        used_dates_per_user: Dict[str, set] = defaultdict(set)

        # First, assign dates for users with multiple blogs (same day for both)
        multi_blog_users = [u for u, indices in user_blog_indices.items() if len(indices) >= 2]
        random.shuffle(date_pool)
        date_index = 0

        for username in multi_blog_users:
            indices = user_blog_indices[username]
            # Assign all blogs from this user to the same date
            assigned_date = date_pool[date_index % len(date_pool)]
            date_index += 1
            for idx in indices:
                blog_date_assignments[idx] = assigned_date
            used_dates_per_user[username].add(assigned_date.date())

        # Then, assign dates for single-blog users
        single_blog_users = [u for u, indices in user_blog_indices.items() if len(indices) == 1]
        for username in single_blog_users:
            idx = user_blog_indices[username][0]
            assigned_date = date_pool[date_index % len(date_pool)]
            date_index += 1
            blog_date_assignments[idx] = assigned_date

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

                # Use pre-assigned date
                blog_created_at = blog_date_assignments[i - 1]

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

        # Create UserDailyActivity records (idempotent - queries existing blogs and comments)
        print("\n📊 Creating daily activity records from blogs and comments...")
        activity_created = 0
        activity_updated = 0

        async with db.begin():
            # Build a combined activity dict: {(username, date): {blogs: N, comments: N}}
            daily_activity = defaultdict(lambda: {"blogs": 0, "comments": 0})

            # Query all blogs grouped by author and date
            result = await db.execute(
                select(
                    Blog.author_username,
                    func.date(Blog.created_at).label("activity_date"),
                    func.count(Blog.id).label("blog_count")
                ).group_by(
                    Blog.author_username,
                    func.date(Blog.created_at)
                )
            )
            blog_activity = result.all()

            for row in blog_activity:
                key = (row.author_username, row.activity_date)
                daily_activity[key]["blogs"] = row.blog_count

            # Query all comments grouped by author and date
            result = await db.execute(
                select(
                    Comment.author_username,
                    func.date(Comment.created_at).label("activity_date"),
                    func.count(Comment.id).label("comment_count")
                ).group_by(
                    Comment.author_username,
                    func.date(Comment.created_at)
                )
            )
            comment_activity = result.all()

            for row in comment_activity:
                key = (row.author_username, row.activity_date)
                daily_activity[key]["comments"] = row.comment_count

            # Create or update UserDailyActivity records
            for (username, activity_date), counts in daily_activity.items():
                blogs_count = counts["blogs"]
                comments_count = counts["comments"]

                # Check if activity record already exists
                result = await db.execute(
                    select(UserDailyActivity).where(
                        UserDailyActivity.username == username,
                        UserDailyActivity.activity_date == activity_date,
                    )
                )
                existing_activity = result.scalar_one_or_none()

                if existing_activity:
                    needs_update = (
                        existing_activity.blogs_made != blogs_count or
                        existing_activity.comments_made != comments_count
                    )
                    if needs_update:
                        existing_activity.blogs_made = blogs_count
                        existing_activity.comments_made = comments_count
                        activity_updated += 1
                else:
                    # Create new record
                    activity = UserDailyActivity(
                        username=username,
                        activity_date=activity_date,
                        blogs_made=blogs_count,
                        comments_made=comments_count,
                    )
                    db.add(activity)
                    activity_created += 1

        print(f"✅ Daily activity: {activity_created} created, {activity_updated} updated")

        # Create follow relationships with skewed distribution
        print("\n👥 Creating follow relationships...")
        usernames = list(user_creation_dates.keys())
        num_users = len(usernames)
        follows_created = 0
        mutual_follows = 0

        async with db.begin():
            # Assign popularity scores using exponential distribution (skewed)
            # Higher score = more followers
            raw_scores = [random.expovariate(1.0) for _ in range(num_users)]
            max_raw, min_raw = max(raw_scores), min(raw_scores)

            # Normalize to range [10, 49] for target follower counts
            min_followers, max_followers = 10, 49
            target_followers = {}
            for i, username in enumerate(usernames):
                normalized = (raw_scores[i] - min_raw) / (max_raw - min_raw + 0.001)
                target_followers[username] = int(
                    min_followers + normalized * (max_followers - min_followers)
                )

            # Track current follower counts and existing follows
            current_followers: Dict[str, int] = defaultdict(int)
            follow_pairs: set = set()  # (follower, following) pairs

            # Phase 1: Create follows to reach target follower counts
            # Iterate through users by popularity (most popular first)
            sorted_users = sorted(
                usernames, key=lambda u: target_followers[u], reverse=True
            )

            for target_user in sorted_users:
                needed = target_followers[target_user] - current_followers[target_user]
                if needed <= 0:
                    continue

                # Get potential followers (users who don't already follow this user)
                potential_followers = [
                    u for u in usernames
                    if u != target_user and (u, target_user) not in follow_pairs
                ]
                random.shuffle(potential_followers)

                # Select followers
                new_followers = potential_followers[:needed]
                for follower in new_followers:
                    follow_pairs.add((follower, target_user))
                    current_followers[target_user] += 1

            # Phase 2: Add mutual follows (~40% chance for each existing follow)
            mutual_probability = 0.4
            existing_pairs = list(follow_pairs)
            for follower, following in existing_pairs:
                reverse_pair = (following, follower)
                if reverse_pair not in follow_pairs and random.random() < mutual_probability:
                    follow_pairs.add(reverse_pair)
                    current_followers[follower] += 1
                    mutual_follows += 1

            # Phase 3: Insert all follows into database
            for follower, following in follow_pairs:
                # Check if follow relationship already exists
                result = await db.execute(
                    select(UserFollow).where(
                        UserFollow.follower_username == follower,
                        UserFollow.following_username == following,
                    )
                )
                existing_follow = result.scalar_one_or_none()

                if not existing_follow:
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

        print(f"✅ Successfully created {follows_created} follow relationships ({mutual_follows} mutual)")

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
        print(f"Daily activity records: {activity_created} created, {activity_updated} updated")
        print("=" * 60)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
