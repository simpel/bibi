import type { OperationContext } from "../../operations/types";
import { toCommentDtos } from "../comment/to-comment-dto";
import type { RunSheetComment } from "./schema";

export type LoadRowCommentsInput = { context: Pick<OperationContext, "db">; orderId: string };

/** The order's active comments for a run sheet, by line id (`null` = the whole order), oldest first. */
export async function loadRowComments({
  context,
  orderId,
}: LoadRowCommentsInput): Promise<Map<string | null, RunSheetComment[]>> {
  const rows = await context.db.comment.findMany({
    where: { orderId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const byLine = new Map<string | null, RunSheetComment[]>();
  for (const comment of await toCommentDtos({ context, rows })) {
    const list = byLine.get(comment.lineId) ?? [];
    list.push({
      body: comment.body,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
    });
    byLine.set(comment.lineId, list);
  }
  return byLine;
}
