import { useApi } from "@/lib/api";
import type { BlogResponse, BlogSearchParams, BlogDetailResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useBlogSearch(params?: BlogSearchParams) {
  const api = useApi();

  return useQuery({
    queryKey: ["blog-search", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.search) {
        searchParams.append("search", params.search);
      }

      if (params?.tags) {
        params.tags.forEach((tag) => searchParams.append("tags", tag));
      }

      if (params?.tags_match_all !== undefined) {
        searchParams.append("tags_match_all", String(params.tags_match_all));
      }

      if (params?.authors) {
        params.authors.forEach((author) =>
          searchParams.append("authors", author)
        );
      }

      if (params?.sort_by) {
        searchParams.append("sort_by", params.sort_by);
      }

      if (params?.sort_order) {
        searchParams.append("sort_order", params.sort_order);
      }

      const queryString = searchParams.toString();

      return api.get<BlogResponse[]>(
        `/blog/search${queryString ? `?${queryString}` : ""}`,
        false
      );
    },
  });
}

export function useBlog(blogId: number) {
  const api = useApi();

  return useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => api.get<BlogDetailResponse>(`/blog/${blogId}`, false),
  });
}
