export interface ApiErrorResponse {
  detail: string;
}

export interface SearchQuery {
  tags: string[];
  authors: string[];
  text: string;
}

export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
