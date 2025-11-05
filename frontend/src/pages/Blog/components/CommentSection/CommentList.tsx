import { type CommentResponse } from "@/types";
import { CommentItem, CommentItemSkeleton } from "./CommentItem";

interface CommentListProps {
  comments: CommentResponse[];
  blogId: number;
}

export function CommentListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <CommentItemSkeleton key={i} />
      ))}
    </div>
  );
}

export function CommentList({ comments, blogId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} blogId={blogId} />
      ))}
    </div>
  );
}
