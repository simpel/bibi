import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { hasPermission } from "../../operations/permission";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { notifyCommentAdded, notifyCommentMentions } from "../notification/comment-follow-ups";
import { checkReadable } from "../order/order-rules";
import { regenerateForLine } from "../run-sheet/regenerate";
import { checkMentions, placeComment } from "./comment-rules";
import {
  CommentCreateInputSchema,
  CommentIdInputSchema,
  CommentSchema,
  CommentUpdateInputSchema,
} from "./schema";
import { authorIdOf, COMMENT_INCLUDE, loadComment, toCommentDtos } from "./to-comment-dto";

type AnyFollowUp = FollowUpInput<unknown, unknown>;

/** A new comment goes on the run sheets and tells the people on the order (ADR 0115). */
async function afterCreated({ ...followUp }: AnyFollowUp) {
  await regenerateForLine(followUp);
  await notifyCommentAdded(followUp);
}

/** An edited comment goes on the run sheets; anyone newly mentioned is told. */
async function afterUpdated({ ...followUp }: AnyFollowUp) {
  await regenerateForLine(followUp);
  await notifyCommentMentions(followUp);
}

type MentionsInput = { context: OperationContext; commentId: string; userIds: readonly string[] };

/** The comment's mentions become exactly these users (join rows, ADR 0056). */
async function replaceMentions({ context, commentId, userIds }: MentionsInput) {
  await context.db.commentMention.deleteMany({ where: { commentId } });
  if (userIds.length === 0) return;
  await context.db.commentMention.createMany({
    data: userIds.map((userId) => ({ commentId, userId, organizationId: context.organizationId })),
  });
}

/** The comment with its mentions, as every command returns it. */
async function reload({ context, id }: { context: OperationContext; id: string }) {
  const row = await context.db.comment.findFirstOrThrow({
    where: { id },
    include: COMMENT_INCLUDE,
  });
  const [comment] = await toCommentDtos({ context, rows: [row] });
  return comment as NonNullable<typeof comment>;
}

export const createComment = defineOperation({
  name: "comment.create",
  kind: "command",
  description:
    "Add a staff comment to an order, to one of its lines with `lineId`, or reply to a comment " +
    "with `parentCommentId` (one level; the reply keeps its comment's line). Mention colleagues " +
    "with `mentionUserIds` and `@Name` in the body. Comments show on the order page and on the " +
    "order's run sheets; the people on the order and those mentioned are told. Internal only.",
  input: CommentCreateInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: afterCreated,
  handler: async ({ input, context }) => {
    const readable = checkReadable({ context, permission: "order:read", path: "orderId" });
    if (!readable.ok) return readable;
    const place = await placeComment({ context, ...input });
    if (!place.ok) return place;
    const mentions = await checkMentions({ context, userIds: input.mentionUserIds });
    if (!mentions.ok) return mentions;
    const { orderId, body } = input;
    const row = await context.db.comment.create({
      data: {
        ...{ orderId, body, lineId: place.value },
        parentCommentId: input.parentCommentId ?? null,
        organizationId: context.organizationId,
      },
    });
    await replaceMentions({ context, commentId: row.id, userIds: mentions.value });
    const comment = await reload({ context, id: row.id });
    context.recordChange({ entityId: row.id, after: comment });
    return ok({ value: comment });
  },
});

type OwnInput = { context: OperationContext; id: string; orDelete?: boolean };

/**
 * The comment when the caller wrote it, or (with `orDelete`) holds `comment:delete`. Someone
 * else's comment is NOT_FOUND, so a comment never reveals more than a read shows (ADR 0115).
 */
async function loadOwn({ context, id, orDelete = false }: OwnInput) {
  const comment = await loadComment({ context, id });
  if (!comment) return null;
  if (comment.createdBy !== null && comment.createdBy === authorIdOf({ context })) return comment;
  const remover =
    orDelete && hasPermission({ permissions: context.permissions, permission: "comment:delete" });
  return remover ? comment : null;
}

export const updateComment = defineOperation({
  name: "comment.update",
  kind: "command",
  description:
    "Edit the text of a comment the caller wrote (others' are NOT_FOUND); `mentionUserIds` " +
    "replaces who is mentioned, and anyone new is told. The order's run sheets get a new version.",
  input: CommentUpdateInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: afterUpdated,
  handler: async ({ input: { id, body, mentionUserIds }, context }) => {
    const before = await loadOwn({ context, id });
    if (!before) return notFound({ entity: "Comment" });
    const mentions = await checkMentions({ context, userIds: mentionUserIds });
    if (!mentions.ok) return mentions;
    const same = before.mentions
      .map((m) => m.userId)
      .sort()
      .join();
    const mentionsChange = mentionUserIds !== undefined && mentions.value.sort().join() !== same;
    if (before.body === body && !mentionsChange) return ok({ value: before });
    await context.db.comment.update({
      where: { id },
      data: { body, editedAt: nowOf({ context }) },
    });
    if (mentionsChange) await replaceMentions({ context, commentId: id, userIds: mentions.value });
    const after = await reload({ context, id });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveComment = defineOperation({
  name: "comment.archive",
  kind: "command",
  description:
    "Delete (archive) a comment: the caller's own, or anyone's with `comment:delete`. Its " +
    "replies stay. It leaves the order page and the next version of the order's run sheets.",
  input: CommentIdInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: regenerateForLine,
  handler: async ({ input: { id }, context }) => {
    const before = await loadOwn({ context, id, orDelete: true });
    if (!before) return notFound({ entity: "Comment" });
    const row = await context.db.comment.update({ where: { id }, data: { status: "ARCHIVED" } });
    const after = { ...row, authorName: before.authorName, mentions: before.mentions };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
