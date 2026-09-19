import type { PaginatedResult } from '@arihant/shared';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export function getPaginationParams(options?: PaginationOptions): { page: number; limit: number; offset: number } {
  const page = Math.max(1, Number(options?.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options?.limit) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function buildPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}
