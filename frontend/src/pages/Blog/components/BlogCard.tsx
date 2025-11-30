import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";
import type { BlogSearchResponse } from "@/types";
import { cn } from "@/lib/utils";
import { TagBadge, AuthorBadge } from "@/components/badges";
import { Clock } from "lucide-react";

interface BlogCardProps {
  blog: BlogSearchResponse;
}

function BlogCardSkeleton() {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer w-full">
      <CardContent>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BlogCard({ blog }: BlogCardProps) {
  const navigate = useNavigate();

  const formattedCreated = new Date(blog.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer w-full",
        "hover:border-primary/50"
      )}
      onClick={() => navigate(`/blog/${blog.id}`)}
    >
      <CardContent>
        <div className="flex flex-col gap-2">
          {/* Subject */}
          <h3 className="text-base font-semibold line-clamp-1">{blog.subject}</h3>

          {/* Author and Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <AuthorBadge value={blog.author_username} />
            {blog.tags.map((tag) => (
              <TagBadge key={tag} value={tag} />
            ))}
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formattedCreated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { BlogCardSkeleton };
