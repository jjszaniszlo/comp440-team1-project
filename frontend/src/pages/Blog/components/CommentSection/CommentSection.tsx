import { useAuth } from "@/hooks/useAuth";
import { useBlogComments } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommentForm, CommentFormSkeleton } from "./CommentForm";
import { CommentList, CommentListSkeleton } from "./CommentList";

interface CommentSectionProps {
  blogId: number;
  isAuthor: boolean;
}

function CommentSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CommentFormSkeleton />
        <CommentListSkeleton />
      </CardContent>
    </Card>
  );
}

export function CommentSection({ blogId, isAuthor }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const { data: comments, isLoading } = useBlogComments(blogId);

  if (isLoading) {
    return <CommentSectionSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAuthenticated && !isAuthor && (
          <CommentForm blogId={blogId} />
        )}
        {isAuthenticated && isAuthor && (
          <div className="text-sm text-muted-foreground italic p-4 bg-muted rounded-lg">
            You cannot comment on your own blog post.
          </div>
        )}
        {!isAuthenticated && (
          <div className="text-sm text-muted-foreground italic p-4 bg-muted rounded-lg">
            Please log in to leave a comment.
          </div>
        )}
        <CommentList comments={comments || []} blogId={blogId} />
      </CardContent>
    </Card>
  );
}
