import { Sentiment, type CommentResponse } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Reply, Send, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommentItem } from "../../hooks";

interface CommentItemProps {
  comment: CommentResponse;
  level?: number;
  blogId: number;
}

export function CommentItemSkeleton({ level = 0 }: { level?: number }) {
  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export function CommentItem({ comment, level = 0, blogId }: CommentItemProps) {
  const {
    // State
    isReplying,
    isEditing,
    showReplies,
    replyContent,
    setReplyContent,
    replySentiment,
    setReplySentiment,
    editContent,
    setEditContent,
    editSentiment,
    setEditSentiment,

    // Derived values
    isAuthenticated,
    isPositive,
    isOwnComment,
    hasReplies,
    replyCount,
    formattedDate,
    replies,
    isLoadingReplies,
    isPending,
    isUpdating,
    isDeleting,

    // Handlers
    handleSubmitReply,
    handleSubmitEdit,
    handleDelete,
    handleCancelReply,
    handleCancelEdit,
    handleToggleReplies,
    handleStartReply,
    handleStartEdit,

    // Validation
    canSubmitReply,
    canSubmitEdit,
  } = useCommentItem({ comment, blogId });

  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">@{comment.author_username}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formattedDate}</span>
          <div className="ml-auto">
            {isPositive ? (
              <ThumbsUp className="h-4 w-4 text-green-600" />
            ) : (
              <ThumbsDown className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>
        {!isEditing ? (
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
        ) : (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isUpdating}
              className="min-h-[80px]"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={editSentiment === Sentiment.POSITIVE ? "default" : "outline"}
                size="sm"
                onClick={() => setEditSentiment(Sentiment.POSITIVE)}
                disabled={isUpdating}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Positive
              </Button>
              <Button
                type="button"
                variant={editSentiment === Sentiment.NEGATIVE ? "default" : "outline"}
                size="sm"
                onClick={() => setEditSentiment(Sentiment.NEGATIVE)}
                disabled={isUpdating}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Negative
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitEdit}
                disabled={!canSubmitEdit}
                className="ml-auto"
              >
                <Send className="h-3 w-3 mr-1" />
                {isUpdating ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleReplies}
            disabled={isLoadingReplies}
          >
            {showReplies ? (
              <ChevronUp className="h-3 w-3 mr-1" />
            ) : (
              <ChevronDown className="h-3 w-3 mr-1" />
            )}
            {isLoadingReplies
              ? "Loading..."
              : showReplies && hasReplies
              ? `Hide ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
              : showReplies && !hasReplies
              ? "No replies"
              : "Load replies"}
          </Button>
          {isAuthenticated && !isOwnComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStartReply}
              disabled={isPending}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
          {isOwnComment && !isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                disabled={isDeleting}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="space-y-2 pt-2">
            <Textarea
              placeholder="Write your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              disabled={isPending}
              className="min-h-[80px]"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={replySentiment === Sentiment.POSITIVE ? "default" : "outline"}
                size="sm"
                onClick={() => setReplySentiment(Sentiment.POSITIVE)}
                disabled={isPending}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Positive
              </Button>
              <Button
                type="button"
                variant={replySentiment === Sentiment.NEGATIVE ? "default" : "outline"}
                size="sm"
                onClick={() => setReplySentiment(Sentiment.NEGATIVE)}
                disabled={isPending}
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Negative
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmitReply}
                disabled={!canSubmitReply}
                className="ml-auto"
              >
                <Send className="h-3 w-3 mr-1" />
                {isPending ? "Sending..." : "Send Reply"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelReply}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
      {showReplies && hasReplies && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} level={level + 1} blogId={blogId} />
          ))}
        </div>
      )}
    </div>
  );
}
