export const BlogStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
} as const;

export type BlogStatus = typeof BlogStatus[keyof typeof BlogStatus];

export interface BlogResponse {
  id: number;
  author_username: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BlogSearchResponse extends BlogResponse {
  subject: string;
  tags: string[];
}

export interface BlogDetailResponse extends BlogResponse {
  subject: string | null;
  description: string | null;
  content: string | null;
  tags: string[];
}

export interface BlogSearchParams {
  search?: string;
  tags?: string[];
  tags_match_all?: boolean;
  authors?: string[];
  sort_by?: 'created_at' | 'updated_at' | 'subject';
  sort_order?: 'asc' | 'desc';
}

export interface BlogCreateRequest {
  subject: string;
}

export interface BlogEditRequest {
  subject?: string;
  description?: string;
  content?: string;
  tags?: string[];
}
