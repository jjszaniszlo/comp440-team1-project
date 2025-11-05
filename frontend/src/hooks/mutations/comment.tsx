import { useApi, getErrorMessage } from "@/lib/api";
import type {
  CommentCreateRequest,
  CommentUpdateRequest,
  CommentResponse,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateComment(blogId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: CommentCreateRequest) =>
      api.post<CommentResponse>(`/blog/${blogId}/comments`, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", blogId] });
      toast.success("Comment added successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to add comment");
      toast.error(message);
    },
  });
}

export function useUpdateComment(blogId: number, commentId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (comment: CommentUpdateRequest) =>
      api.patch<CommentResponse>(`/blog/${blogId}/comments/${commentId}`, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", blogId] });
      toast.success("Comment updated successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to update comment");
      toast.error(message);
    },
  });
}

export function useDeleteComment(blogId: number, commentId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.delete(`/blog/${blogId}/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-comments", blogId] });
      toast.success("Comment deleted successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to delete comment");
      toast.error(message);
    },
  });
}
