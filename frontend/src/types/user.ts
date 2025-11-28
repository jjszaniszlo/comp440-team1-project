export interface UserSignup {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface UserResponse {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// Added for user search endpoint
export interface UserSearchParams {
  tags?: string[];
  same_day_tags?: boolean;
  // Date to filter by (YYYY-MM-DD format)
  date?: string;
  followed_by?: string[];
  never_posted_blog?: boolean;
}

export interface UserLiteResponse {
  username: string;
}

export function buildUserSearchQuery(params: UserSearchParams): string {
  const searchParams = new URLSearchParams();

  // Add tags (multiple values)
  if (params.tags && params.tags.length > 0) {
    params.tags.forEach(tag => searchParams.append('tags', tag));
  }

  // Add same_day_tags
  if (params.same_day_tags !== undefined) {
    searchParams.append('same_day_tags', String(params.same_day_tags));
  }

  // Add date
  if (params.date) {
    searchParams.append('date', params.date);
  }

  // Add followed_by (multiple values)
  if (params.followed_by && params.followed_by.length > 0) {
    params.followed_by.forEach(username => searchParams.append('followed_by', username));
  }

  // Add never_posted_blog
  if (params.never_posted_blog !== undefined) {
    searchParams.append('never_posted_blog', String(params.never_posted_blog));
  }

  return searchParams.toString();
}

export async function searchUsers(
  params: UserSearchParams
): Promise<UserLiteResponse[]> {
  const queryString = buildUserSearchQuery(params);
  const url = `/api/v1/blog/users/search${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search users: ${response.statusText}`);
  }

  return response.json();
}