import type { OperationContext } from "../../operations/types";
import type { CommentDto } from "../comment/schema";
import { COMMENT_INCLUDE, toCommentDtos } from "../comment/to-comment-dto";
import type { RunSheetComment } from "./schema";

export type LoadRowCommentsInput = { context: Pick<OperationContext, "db">; orderId: string };

/** Oldest first, each comment followed by its replies; a reply to a deleted comment stands alone. */
function threaded({ comments }: { comments: CommentDto[] }): CommentDto[] {
  const ids = new Set(comments.map((comment) => comment.id));
  const isTop = ({ parentCommentId }: CommentDto) => !parentCommentId || !ids.has(parentCommentId);
  return comments
    .filter(isTop)
    .flatMap((top) => [
      top,
      ...comments.filter((reply) => !isTop(reply) && reply.parentCommentId === top.id),
    ]);
}

/**
 * The order's active comments for a run sheet, by line id (`null` = the whole order), each
 * followed by its replies (ADR 0115).
 */
export async function loadRowComments({
  context,
  orderId,
}: LoadRowCommentsInput): Promise<Map<string | null, RunSheetComment[]>> {
  const rows = await context.db.comment.findMany({
    where: { orderId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: COMMENT_INCLUDE,
  });
  const comments = await toCommentDtos({ context, rows });
  const byLine = new Map<string | null, RunSheetComment[]>();
  for (const comment of threaded({ comments })) {
    const list = byLine.get(comment.lineId) ?? [];
    list.push({
      body: comment.body,
      authorName: comment.authorName,
      createdAt: comment.createdAt.toISOString(),
      reply:
        comment.parentCommentId !== null && comments.some((c) => c.id === comment.parentCommentId),
    });
    byLine.set(comment.lineId, list);
  }
  return byLine;
}
