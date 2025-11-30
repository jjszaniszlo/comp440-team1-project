import { useState } from "react";
import { useParams, Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TagBadge } from "@/components/badges";
import {
  useUserProfile,
  useUserComments,
  useIsFollowing,
} from "@/hooks/queries/profile";
import { useBlogSearchInfinite } from "@/hooks/queries/blog";
import { useFollowUser, useUnfollowUser } from "@/hooks/mutations/follow";
import { useUserMe } from "@/hooks/queries/user";
import { Clock, Users, UserPlus, UserMinus, MessageSquare, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import type { BlogSearchResponse, UserCommentResponse } from "@/types";

type ContentTab = "blogs" | "comments";

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-8">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BlogItem({ blog }: { blog: BlogSearchResponse }) {
  const formattedDate = new Date(blog.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link to={`/blog/${blog.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate min-w-0">{blog.subject}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto shrink-0">
                <Clock className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            </div>
            {blog.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {blog.tags.map((tag) => (
                  <TagBadge key={tag} value={tag} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CommentItem({ comment }: { comment: UserCommentResponse }) {
  const formattedDate = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isPositive = comment.sentiment === "positive";

  return (
    <Link to={`/blog/${comment.blog_id}`}>
      <div className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate min-w-0">
            {comment.blog_subject || "Untitled Blog"}
          </span>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span>•</span>
            <span className="whitespace-nowrap">{formattedDate}</span>
            {isPositive ? (
              <ThumbsUp className="h-4 w-4 text-green-600" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
        <p className="whitespace-pre-wrap line-clamp-3">{comment.content}</p>
      </div>
    </Link>
  );
}

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<ContentTab>("blogs");

  const { data: currentUser } = useUserMe();
  const { data: profile, isLoading: profileLoading } = useUserProfile(username || "");
  const { data: isFollowing, isLoading: followLoading } = useIsFollowing(username || "");
  const { data: commentsData, isLoading: commentsLoading } = useUserComments(username || "");
  const blogsQuery = useBlogSearchInfinite({ authors: username ? [username] : [] });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = currentUser?.username === username;
  const isAuthenticated = !!currentUser;

  const blogs = blogsQuery.data?.pages.flatMap((page) => page.items) || [];

  const handleFollowToggle = () => {
    if (!username) return;
    if (isFollowing) {
      unfollowMutation.mutate(username);
    } else {
      followMutation.mutate(username);
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">User not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {profile.first_name[0]?.toUpperCase()}
                </span>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold">@{profile.username}</h1>
                <p className="text-muted-foreground">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>

              <div className="flex gap-8">
                <Link
                  to={`/profile/${username}/followers`}
                  className="flex flex-col items-center hover:text-primary transition-colors"
                >
                  <span className="text-2xl font-bold">{profile.follower_count}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Followers
                  </span>
                </Link>
                <Link
                  to={`/profile/${username}/following`}
                  className="flex flex-col items-center hover:text-primary transition-colors"
                >
                  <span className="text-2xl font-bold">{profile.following_count}</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Following
                  </span>
                </Link>
              </div>

              {isAuthenticated && !isOwnProfile && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading || followMutation.isPending || unfollowMutation.isPending}
                  variant={isFollowing ? "outline" : "default"}
                  className="mt-2"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "blogs" ? "default" : "outline"}
            onClick={() => setActiveTab("blogs")}
            className="flex-1"
          >
            <FileText className="h-4 w-4" />
            Blogs ({blogs.length})
          </Button>
          <Button
            variant={activeTab === "comments" ? "default" : "outline"}
            onClick={() => setActiveTab("comments")}
            className="flex-1"
          >
            <MessageSquare className="h-4 w-4" />
            Comments ({commentsData?.length || 0})
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {activeTab === "blogs" ? (
            blogsQuery.isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </>
            ) : blogs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No blogs yet</p>
                </CardContent>
              </Card>
            ) : (
              blogs.map((blog) => <BlogItem key={blog.id} blog={blog} />)
            )
          ) : commentsLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </>
          ) : !commentsData || commentsData.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No comments yet</p>
              </CardContent>
            </Card>
          ) : (
            commentsData.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
