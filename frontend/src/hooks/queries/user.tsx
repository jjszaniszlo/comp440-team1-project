import { useApi } from "@/lib/api";
import type { UserLiteResponse, UserResponse, UserSearchParams } from "@/types";
import { useQuery } from "@tanstack/react-query";

export function useUserMe() {
  const api = useApi();

  return useQuery({
    queryKey: ["user-me"],
    queryFn: () => api.get<UserResponse>("/auth/me/"),
    enabled: api.auth.isAuthenticated(),
  });
}

function buildUserSearchQuery(params: UserSearchParams): string {
  const searchParams = new URLSearchParams();

  if (params.tags && params.tags.length > 0) {
    params.tags.forEach((tag) => searchParams.append("tags", tag));
  }

  if (params.same_day_tags) {
    searchParams.append("same_day_tags", "true");
  }

  if (params.date) {
    searchParams.append("date", params.date);
  }

  if (params.followed_by && params.followed_by.length > 0) {
    params.followed_by.forEach((username) =>
      searchParams.append("followed_by", username)
    );
  }

  if (params.never_posted_blog) {
    searchParams.append("never_posted_blog", "true");
  }

  return searchParams.toString();
}

export function useSearchUsers(params: UserSearchParams) {
  const api = useApi();
  const queryString = buildUserSearchQuery(params);
  const endpoint = `/blog/users/search${queryString ? `?${queryString}` : ""}`;

  const hasActiveFilter =
    (params.tags && params.tags.length > 0) ||
    (params.followed_by && params.followed_by.length > 0) ||
    params.date ||
    params.never_posted_blog;

  return useQuery({
    queryKey: ["users", "search", params],
    queryFn: () => api.get<UserLiteResponse[]>(endpoint, false),
    enabled: !!hasActiveFilter,
  });
}
