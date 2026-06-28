export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TableState {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
  search?: string;
  filters?: Record<string, any>;
}
