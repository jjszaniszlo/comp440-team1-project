export const Sentiment = {
  POSITIVE: "positive",
  NEGATIVE: "negative",
} as const;

export type Sentiment = typeof Sentiment[keyof typeof Sentiment];

export interface CommentCreateRequest {
  content: string;
  sentiment: Sentiment;
  parent_comment_id?: number;
}

export interface CommentUpdateRequest {
  content: string;
  sentiment: Sentiment;
}

export interface CommentResponse {
  id: number;
  content: string;
  sentiment: Sentiment;
  blog_id: number;
  author_username: string;
  parent_comment_id: number | null;
  created_at: string;
  updated_at: string;
}