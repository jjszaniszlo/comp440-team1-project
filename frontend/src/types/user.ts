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

