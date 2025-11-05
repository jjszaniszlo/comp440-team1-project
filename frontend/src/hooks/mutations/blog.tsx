import { useApi, getErrorMessage } from "@/lib/api";
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
      const message = getErrorMessage(error, "Failed to create blog");
      toast.error(message);
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
      const message = getErrorMessage(error, "Failed to update blog");
      toast.error(message);
    },
  });
}

export function usePublishBlog(blogId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<BlogResponse>(`/blog/${blogId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", blogId] });
      queryClient.invalidateQueries({ queryKey: ["blog-search"] });
      toast.success("Blog published successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to publish blog");
      toast.error(message);
    },
  });
}

export function useUnpublishBlog(blogId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<BlogResponse>(`/blog/${blogId}/delist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", blogId] });
      queryClient.invalidateQueries({ queryKey: ["blog-search"] });
      toast.success("Blog unpublished successfully!");
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to unpublish blog");
      toast.error(message);
    },
  });
}
