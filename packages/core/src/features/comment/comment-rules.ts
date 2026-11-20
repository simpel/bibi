import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkLevel } from "../requirement/requirement-rules";

type Db = { context: Pick<OperationContext, "db"> };

export type PlaceInput = Db & {
  orderId: string;
  lineId?: string | null | undefined;
  parentCommentId?: string | null | undefined;
};

const issue = ({ path, message }: { path: string; message: string }) =>
  invalid({ message, issues: [{ path, message }] });

/**
 * Where a comment goes (ADR 0115): the order or one of its lines; a reply goes where its parent
 * is, on the same order, and replies one level only. Returns the line it is about.
 */
export async function placeComment({
  context,
  orderId,
  lineId,
  parentCommentId,
}: PlaceInput): Promise<Result<string | null>> {
  if (!parentCommentId) {
    const level = await checkLevel({ context, orderId, lineId: lineId ?? null });
    return level.ok ? ok({ value: lineId ?? null }) : level;
  }
  const parent = await context.db.comment.findFirst({
    where: { id: parentCommentId },
    select: { orderId: true, lineId: true, parentCommentId: true },
  });
  if (!parent || parent.orderId !== orderId) {
    return issue({ path: "parentCommentId", message: "Not a comment on the order" });
  }
  if (parent.parentCommentId) {
    return issue({ path: "parentCommentId", message: "Reply to the first comment, not a reply" });
  }
  if (lineId && lineId !== parent.lineId) {
    return issue({ path: "lineId", message: "A reply is about its comment's line" });
  }
  return ok({ value: parent.lineId });
}

export type CheckMentionsInput = Db & { userIds: readonly string[] | undefined };

/** Every mentioned user is a member of the organization (`VALIDATION` at `mentionUserIds`). */
export async function checkMentions({
  context,
  userIds,
}: CheckMentionsInput): Promise<Result<string[]>> {
  const ids = [...new Set(userIds ?? [])];
  if (ids.length === 0) return ok({ value: [] });
  const found = await context.db.member.count({ where: { userId: { in: ids } } });
  if (found === ids.length) return ok({ value: ids });
  return issue({ path: "mentionUserIds", message: "Mention members of the organization only" });
}
