import type { Comment } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { memberNames } from "../../shared/member-names";
import type { CommentDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type ToCommentDtosInput = Db & { rows: readonly Comment[] };

/** Comment rows → DTOs with their authors' names (one member lookup). */
export async function toCommentDtos({ context, rows }: ToCommentDtosInput): Promise<CommentDto[]> {
  const names = await memberNames({ context, userIds: rows.map((row) => row.createdBy) });
  return rows.map((row) => ({
    ...row,
    authorName: row.createdBy ? (names.get(row.createdBy) ?? null) : null,
  }));
}

export type LoadCommentInput = Db & { id: string };

/** The active comment, or null when missing, archived or in another organization. */
export async function loadComment({ context, id }: LoadCommentInput): Promise<CommentDto | null> {
  const row = await context.db.comment.findFirst({ where: { id } });
  if (!row) return null;
  const [comment] = await toCommentDtos({ context, rows: [row] });
  return comment ?? null;
}

/** Who writes as the caller: the user, else the API key (as `scopedDb` sets `createdBy`). */
export function authorIdOf({ context }: { context: Pick<OperationContext, "actor"> }) {
  return context.actor.userId ?? context.actor.apiKeyId ?? null;
}
