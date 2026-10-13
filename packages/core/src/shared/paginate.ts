export type PaginateInput<T extends { id: string }> = { rows: T[]; limit: number };
export type Page<T> = { items: T[]; nextCursor: string | null };

/** Expects `limit + 1` rows; the extra row only signals that another page exists. */
export function paginate<T extends { id: string }>({ rows, limit }: PaginateInput<T>): Page<T> {
  const items = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
}
