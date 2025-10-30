export interface ApiErrorResponse {
  detail: string;
}

export interface SearchQuery {
  tags: string[];
  authors: string[];
  text: string;
}
