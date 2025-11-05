import { useApi } from "@/lib/api";
import type { BlogSearchResponse, BlogSearchParams, BlogDetailResponse, PaginatedResponse } from "@/types";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export function useBlogSearchInfinite(params?: BlogSearchParams, pageSize: number = 20) {
  const api = useApi();

  return useInfiniteQuery({
    queryKey: ["blog-search-infinite", params, pageSize],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();

      searchParams.append("page", String(pageParam));
      searchParams.append("size", String(pageSize));

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

      return api.get<PaginatedResponse<BlogSearchResponse>>(
        `/blog/search${queryString ? `?${queryString}` : ""}`,
        false
      );
    },
    getNextPageParam: (lastPage) => {
      return lastPage.meta.has_next ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

export function useBlog(blogId: number) {
  const api = useApi();

  return useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => api.get<BlogDetailResponse>(`/blog/${blogId}`, false),
  });
}
