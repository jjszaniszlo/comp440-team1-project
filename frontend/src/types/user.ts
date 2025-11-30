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

export interface UserSearchParams {
  tags?: string[];
  same_day_tags?: boolean;
  date?: string;
  followed_by?: string[];
  never_posted_blog?: boolean;
}

export interface UserLiteResponse {
  username: string;
}

export interface UserPublicProfile {
  username: string;
  first_name: string;
  last_name: string;
  follower_count: number;
  following_count: number;
}

export interface UserPrivateProfile extends UserPublicProfile {
  email: string;
  phone: string;
}

export interface UserCommentResponse {
  id: number;
  content: string;
  sentiment: "positive" | "negative";
  blog_id: number;
  blog_subject: string | null;
  parent_comment_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FollowUserResponse {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  followed_at: string;
}

