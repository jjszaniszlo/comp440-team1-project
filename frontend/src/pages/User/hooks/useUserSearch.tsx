import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UserSearchParams {
  tags?: string[];
  same_day_tags?: boolean;
  date?: string;
  followed_by?: string[];
  never_posted_blog?: boolean;
}

export interface UserLite {
  username: string;
}

async function searchUsers(params: UserSearchParams): Promise<UserLite[]> {
  const queryParams = new URLSearchParams();

  //tags as array parameters
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach(tag => queryParams.append('tags', tag));
  }

  //same_day_tags flag
  if (params.same_day_tags) {
    queryParams.append('same_day_tags', 'true');
  }

  //date filter
  if (params.date) {
    queryParams.append('date', params.date);
  }

  //followed_by as array parameters
  if (params.followed_by && params.followed_by.length > 0) {
    params.followed_by.forEach(username => queryParams.append('followed_by', username));
  }

  //never_posted_blog flag
  if (params.never_posted_blog) {
    queryParams.append('never_posted_blog', 'true');
  }

  const endpoint = `/blog/users/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return api.get<UserLite[]>(endpoint, false);
}

export function useUserSearch(params: UserSearchParams, enabled: boolean = true) {
  return useQuery({
    queryKey: ['users', 'search', params],
    queryFn: () => searchUsers(params),
    enabled: enabled,
    staleTime: 30000,
  });
}
