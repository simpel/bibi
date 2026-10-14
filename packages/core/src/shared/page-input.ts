import { z } from "zod";

/** Cursor pagination shared by every `*.list` operation. */
export const PageInputShape = {
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
};

export type PageArgsInput = { limit: number; cursor?: string | undefined };

/** Prisma `take`/`cursor`/`skip` for `paginate` (one extra row signals another page). */
export function pageArgs({ limit, cursor }: PageArgsInput) {
  return { take: limit + 1, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) };
}
