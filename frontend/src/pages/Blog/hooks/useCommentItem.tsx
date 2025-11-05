import { useState } from "react";
import { Sentiment, type CommentResponse } from "@/types";
import { useCreateComment, useUpdateComment, useDeleteComment, useBlogComments, useUserMe } from "@/hooks";
import { useAuth } from "@/hooks/useAuth";

interface UseCommentItemProps {
  comment: CommentResponse;
  blogId: number;
}

export function useCommentItem({ comment, blogId }: UseCommentItemProps) {
  const { isAuthenticated } = useAuth();
  const { data: currentUser } = useUserMe();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySentiment, setReplySentiment] = useState<Sentiment | null>(null);
  const [editContent, setEditContent] = useState(comment.content);
  const [editSentiment, setEditSentiment] = useState<Sentiment>(comment.sentiment);

  const { mutate: createComment, isPending } = useCreateComment(blogId);
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment(blogId, comment.id);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment(blogId, comment.id);

  const { data: replies = [], isLoading: isLoadingReplies } = useBlogComments(
    blogId,
    showReplies ? comment.id : null
  );

  const isPositive = comment.sentiment === Sentiment.POSITIVE;
  const isOwnComment = currentUser?.username === comment.author_username;
  const hasReplies = replies.length > 0;
  const replyCount = replies.length;
  const formattedDate = new Date(comment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSubmitReply = () => {
    if (!replyContent.trim() || !replySentiment) return;

    createComment(
      {
        content: replyContent.trim(),
        sentiment: replySentiment,
        parent_comment_id: comment.id,
      },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplySentiment(null);
          setIsReplying(false);
        },
      }
    );
  };

  const handleSubmitEdit = () => {
    if (!editContent.trim()) return;

    updateComment(
      {
        content: editContent.trim(),
        sentiment: editSentiment,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      deleteComment();
    }
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyContent("");
    setReplySentiment(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditSentiment(comment.sentiment);
  };

  const handleToggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleStartReply = () => {
    setIsReplying(!isReplying);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const canSubmitReply = replyContent.trim() && replySentiment && !isPending;
  const canSubmitEdit = editContent.trim() && !isUpdating;

  return {
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
  };
}
