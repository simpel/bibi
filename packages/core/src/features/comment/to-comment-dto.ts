import type { Comment } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { memberNames } from "../../shared/member-names";
import type { CommentDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

/** Prisma `include` for every comment read (`toCommentDtos`): who it mentions. */
export const COMMENT_INCLUDE = { mentions: { select: { userId: true } } } as const;

export type CommentRow = Comment & { mentions: { userId: string }[] };

export type ToCommentDtosInput = Db & { rows: readonly CommentRow[] };

/** Comment rows → DTOs with their authors' and mentioned colleagues' names (one member lookup). */
export async function toCommentDtos({ context, rows }: ToCommentDtosInput): Promise<CommentDto[]> {
  const userIds = rows.flatMap((row) => [row.createdBy, ...row.mentions.map((m) => m.userId)]);
  const names = await memberNames({ context, userIds });
  return rows.map(({ mentions, ...row }) => ({
    ...row,
    authorName: row.createdBy ? (names.get(row.createdBy) ?? null) : null,
    mentions: mentions.map(({ userId }) => ({ userId, name: names.get(userId) ?? null })),
  }));
}

export type LoadCommentInput = Db & { id: string };

/** The active comment, or null when missing, archived or in another organization. */
export async function loadComment({ context, id }: LoadCommentInput): Promise<CommentDto | null> {
  const row = await context.db.comment.findFirst({ where: { id }, include: COMMENT_INCLUDE });
  if (!row) return null;
  const [comment] = await toCommentDtos({ context, rows: [row] });
  return comment ?? null;
}

/** Who writes as the caller: the user, else the API key (as `scopedDb` sets `createdBy`). */
export function authorIdOf({ context }: { context: Pick<OperationContext, "actor"> }) {
  return context.actor.userId ?? context.actor.apiKeyId ?? null;
}
