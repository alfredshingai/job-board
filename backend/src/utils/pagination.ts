import { z } from 'zod';

/** Schema for `?page=` / `?pageSize=` query params. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type Pagination = z.infer<typeof paginationSchema>;

/** Standard list envelope returned by every paginated endpoint. */
export type Paginated<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export function paginate<T>(
  items: T[],
  total: number,
  { page, pageSize }: Pagination,
): Paginated<T> {
  return {
    data: items,
    meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

/** Prisma helpers derived from the pagination params. */
export function skipTake({ page, pageSize }: Pagination) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
