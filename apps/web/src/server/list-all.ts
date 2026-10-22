import "server-only";
import { type Operation, ok, type Result } from "@bibi/core";
import type { z } from "zod";
import { runOperation } from "./run-operation";

type Page<T> = { items: T[]; nextCursor: string | null };

/** The row type of a list operation's output. */
type ItemOf<O extends z.ZodType> = z.infer<O> extends { items: (infer T)[] } ? T : never;

export type ListAllInput<I extends z.ZodType, O extends z.ZodType> = {
  operation: Operation<I, O>;
  input: z.input<I>;
  /** Stop after this many pages (100 rows each), so one view never reads without bound. */
  maxPages?: number;
};

/** Every page of a `*.list` operation, concatenated; the first error ends the walk. */
export async function listAll<I extends z.ZodType, O extends z.ZodType>({
  operation,
  input,
  maxPages = 10,
}: ListAllInput<I, O>): Promise<Result<ItemOf<O>[]>> {
  const items: ItemOf<O>[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const result = await runOperation({
      operation,
      input: { ...(input as object), limit: 100, ...(cursor ? { cursor } : {}) } as z.input<I>,
    });
    if (!result.ok) return result;
    const value = result.value as Page<ItemOf<O>>;
    items.push(...value.items);
    if (!value.nextCursor) break;
    cursor = value.nextCursor;
  }
  return ok({ value: items });
}
