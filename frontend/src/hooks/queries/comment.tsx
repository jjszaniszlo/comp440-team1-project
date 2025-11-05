import { useApi } from "@/lib/api";
import type { CommentResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useBlogComments(blogId: number, parentCommentId?: number | null) {
  const api = useApi();

  return useQuery({
    queryKey: ["blog-comments", blogId, parentCommentId ?? "root"],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (parentCommentId !== undefined && parentCommentId !== null) {
        searchParams.append("parent_comment_id", String(parentCommentId));
      }

      const url = `/blog/${blogId}/comments${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      return api.get<CommentResponse[]>(url, false);
    },
  });
}
