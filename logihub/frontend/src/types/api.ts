/** Standard error shape returned by all backend endpoints */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
