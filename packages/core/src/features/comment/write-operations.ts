import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { checkReadable } from "../order/order-rules";
import { checkLevel } from "../requirement/requirement-rules";
import { regenerateForLine } from "../run-sheet/regenerate";
import {
  CommentCreateInputSchema,
  type CommentDto,
  CommentIdInputSchema,
  CommentSchema,
  CommentUpdateInputSchema,
} from "./schema";
import { authorIdOf, loadComment, toCommentDtos } from "./to-comment-dto";

export const createComment = defineOperation({
  name: "comment.create",
  kind: "command",
  description:
    "Add a staff comment to an order, or to one of its lines with `lineId`. Comments show on " +
    "the order page and on the order's run sheets (a line's on its row), so the next version " +
    "of each run sheet carries it. Internal text only; customers never see it.",
  input: CommentCreateInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: regenerateForLine,
  handler: async ({ input: { orderId, lineId, body }, context }) => {
    const readable = checkReadable({ context, permission: "order:read", path: "orderId" });
    if (!readable.ok) return readable;
    const level = await checkLevel({ context, orderId, lineId: lineId ?? null });
    if (!level.ok) return level;
    const row = await context.db.comment.create({
      data: { orderId, lineId: lineId ?? null, body, organizationId: context.organizationId },
    });
    const [comment] = await toCommentDtos({ context, rows: [row] });
    context.recordChange({ entityId: row.id, after: comment });
    return ok({ value: comment as CommentDto });
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
    "Edit the text of a comment the caller wrote (others' are NOT_FOUND). The order's run " +
    "sheets get a new version with the change.",
  input: CommentUpdateInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: regenerateForLine,
  handler: async ({ input: { id, body }, context }) => {
    const before = await loadOwn({ context, id });
    if (!before) return notFound({ entity: "Comment" });
    if (before.body === body) return ok({ value: before });
    const row = await context.db.comment.update({
      where: { id },
      data: { body, editedAt: nowOf({ context }) },
    });
    const after = { ...row, authorName: before.authorName };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});

export const archiveComment = defineOperation({
  name: "comment.archive",
  kind: "command",
  description:
    "Delete (archive) a comment: the caller's own, or anyone's with `comment:delete`. It " +
    "leaves the order page and the next version of the order's run sheets.",
  input: CommentIdInputSchema,
  output: CommentSchema,
  permission: "comment:write",
  followUp: regenerateForLine,
  handler: async ({ input: { id }, context }) => {
    const before = await loadOwn({ context, id, orDelete: true });
    if (!before) return notFound({ entity: "Comment" });
    const row = await context.db.comment.update({ where: { id }, data: { status: "ARCHIVED" } });
    const after = { ...row, authorName: before.authorName };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
