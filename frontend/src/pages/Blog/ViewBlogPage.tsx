import { useParams, useNavigate } from "react-router";
import { useBlog, useUserMe } from "@/hooks/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Pencil, Clock } from "lucide-react";
import { TagBadge, AuthorBadge, PublishBadge } from "@/components/badges";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { CommentSection } from "./components/CommentSection";
import { ApiErrorCard } from "@/components/ApiErrorCard";

function ViewBlogPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ViewBlogPage() {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { data: blog, isLoading, error } = useBlog(Number(blogId));
  const { data: user } = useUserMe();

  const isAuthor = user?.username === blog?.author_username;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTitleFontSize = (subject: string | null) => {
    if (!subject) return "text-4xl";
    const length = subject.length;
    if (length <= 30) return "text-4xl";
    if (length <= 50) return "text-3xl";
    if (length <= 70) return "text-2xl";
    return "text-xl";
  };

  if (isLoading) {
    return <ViewBlogPageSkeleton />;
  }

  if (error || !blog) {
    return (
      <ApiErrorCard
        error={error ?? new Error("Blog not found")}
        errorMessages={{
          404: {
            title: "Blog Not Found",
            description:
              "The blog you're looking for doesn't exist or has been deleted.",
          },
        }}
        defaultTitle="Error Loading Blog"
        defaultDescription="An error occurred while loading the blog post"
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2 justify-between">
                <h1 className={`${getTitleFontSize(blog.subject)} font-bold`}>
                  {blog.subject}
                </h1>
                {isAuthor && (
                  <div className="flex items-center gap-2">
                    <PublishBadge status={blog.status} />
                    <Button
                      onClick={() => navigate(`/blog/${blogId}/edit`)}
                      variant="outline"
                      size="sm"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              {blog.description && (
                <p className="text-muted-foreground text-lg">
                  {blog.description}
                </p>
              )}
              <AuthorBadge value={blog.author_username} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Created: {formatDate(blog.created_at)}</span>
                </div>
                {blog.created_at !== blog.updated_at && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Updated: {formatDate(blog.updated_at)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {blog.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {blog.tags.map((tag) => (
                <TagBadge key={tag} value={tag} />
              ))}
            </div>
          )}
          <Separator className="my-4" />
        </CardHeader>

        <CardContent>
          <MarkdownViewer content={blog.content || ""} />
        </CardContent>
      </Card>

      <CommentSection blogId={Number(blogId)} isAuthor={isAuthor} />
    </div>
  );
}
