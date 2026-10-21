import { listLines } from "../../features/line/operations";
import type { LineDto } from "../../features/line/schema";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";

/** Every active line through `line.list`, page by page; null when a page cannot be read. */
export async function allLines({
  context,
}: {
  context: ExecuteContext;
}): Promise<LineDto[] | null> {
  const lines: LineDto[] = [];
  let cursor: string | undefined;
  do {
    const page = await execute({
      operation: listLines,
      input: { limit: 100, ...(cursor ? { cursor } : {}) },
      context,
    });
    if (!page.ok) return null;
    lines.push(...page.value.items);
    cursor = page.value.nextCursor ?? undefined;
  } while (cursor);
  return lines;
}
