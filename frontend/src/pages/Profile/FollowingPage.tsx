import { useParams, Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUserFollowing } from "@/hooks/queries/profile";
import { ArrowLeft, Clock, Users } from "lucide-react";
import type { FollowUserResponse } from "@/types";

function FollowingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function UserItem({ user }: { user: FollowUserResponse }) {
  const formattedDate = new Date(user.followed_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link to={`/profile/${user.username}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">
                {user.first_name[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-semibold truncate">@{user.username}</span>
              <span className="text-sm text-muted-foreground truncate">
                {user.first_name} {user.last_name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const { data: following, isLoading } = useUserFollowing(username || "");

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link to={`/profile/${username}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Following</h1>
            <p className="text-muted-foreground">@{username}</p>
          </div>
        </div>

        {isLoading ? (
          <FollowingSkeleton />
        ) : !following || following.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Not following anyone yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {following.map((user) => (
              <UserItem key={user.username} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
