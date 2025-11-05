import json
from pathlib import Path


def merge_mock_data():
    script_dir = Path(__file__).parent

    print("🔄 Merging mock data files...")

    users_file = script_dir / "blog_platform_users.json"
    if not users_file.exists():
        print(f"❌ Error: Users file not found at {users_file}")
        return False

    print(f"📖 Loading users from {users_file}")
    with open(users_file, "r", encoding="utf-8") as f:
        users_data = json.load(f)

    users = users_data.get("users", [])
    print(f"✅ Loaded {len(users)} users")

    all_blogs = []
    for i in range(1, 11):
        blog_file = script_dir / f"blog_platform_blogs_{i:02d}.json"

        if not blog_file.exists():
            print(f"⚠️  Warning: Blog file not found at {blog_file}, skipping...")
            continue

        print(f"📖 Loading blogs from {blog_file}")
        with open(blog_file, "r", encoding="utf-8") as f:
            blog_data = json.load(f)

        blogs = blog_data.get("blogs", [])
        all_blogs.extend(blogs)
        print(f"  ✓ Loaded {len(blogs)} blogs (total: {len(all_blogs)})")

    print(f"✅ Loaded {len(all_blogs)} total blogs")

    print("\n🔍 Validating data...")

    usernames = [u["username"] for u in users]
    if len(usernames) != len(set(usernames)):
        print("❌ Error: Duplicate usernames found in users")
        return False
    print(f"  ✓ All {len(usernames)} usernames are unique")

    subjects = [b["subject"] for b in all_blogs]
    if len(subjects) != len(set(subjects)):
        duplicates = [s for s in subjects if subjects.count(s) > 1]
        print(f"❌ Error: Duplicate blog subjects found: {set(duplicates)}")
        return False
    print(f"  ✓ All {len(subjects)} blog subjects are unique")

    blog_authors = [b["author_username"] for b in all_blogs]
    for author in blog_authors:
        if author not in usernames:
            print(f"❌ Error: Blog author '{author}' not found in users")
            return False

    author_counts = {username: blog_authors.count(username) for username in usernames}
    users_with_no_blogs = [u for u, count in author_counts.items() if count == 0]
    users_with_multiple_blogs = [u for u, count in author_counts.items() if count > 1]

    if users_with_no_blogs:
        print(
            f"⚠️  Warning: {len(users_with_no_blogs)} users have no blogs: {users_with_no_blogs[:5]}"
        )

    if users_with_multiple_blogs:
        print(f"❌ Error: {len(users_with_multiple_blogs)} users have multiple blogs:")
        for user in users_with_multiple_blogs[:5]:
            print(f"  - {user}: {author_counts[user]} blogs")
        return False

    print(f"  ✓ All {len(usernames)} users have blogs assigned")
    print("  ✓ All blog authors exist in users array")

    merged_data = {"users": users, "blogs": all_blogs}

    output_file = script_dir / "blog_platform_mock_data.json"
    print(f"\n💾 Writing merged data to {output_file}")

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)

    print("=" * 60)
    print("✅ Mock data merged successfully!")
    print("=" * 60)
    print(f"Users: {len(users)}")
    print(f"Blogs: {len(all_blogs)}")

    def count_comments(comments):
        count = len(comments)
        for comment in comments:
            if "replies" in comment and comment["replies"]:
                count += count_comments(comment["replies"])
        return count

    total_comments = sum(count_comments(blog["comments"]) for blog in all_blogs)
    print(f"Comments: {total_comments}")

    unique_tags = set()
    for blog in all_blogs:
        unique_tags.update(blog["tags"])
    print(f"Unique tags: {len(unique_tags)}")

    print("=" * 60)
    print("\n✨ Ready to seed! Run: python -m app.scripts.seed")

    return True


if __name__ == "__main__":
    success = merge_mock_data()
    exit(0 if success else 1)
