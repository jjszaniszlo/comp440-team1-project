import { useApi, ApiError } from "@/lib/api";
import type {
  BlogEditRequest,
  BlogResponse,
  BlogDetailResponse,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateBlog() {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<BlogResponse>("/blog/"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-search"] });
      toast.success("Blog created successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const message = error.data?.detail || error.statusText || "Failed to create blog";
        toast.error(message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  });
}

export function useUpdateBlog(blogId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blog: BlogEditRequest) =>
      api.patch<BlogDetailResponse>(`/blog/${blogId}`, blog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", blogId] });
      queryClient.invalidateQueries({ queryKey: ["blog-search"] });
      toast.success("Blog updated successfully!");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const message = error.data?.detail || error.statusText || "Failed to update blog";
        toast.error(message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
  });
}
