import { z } from "zod";
import type { FollowUpInput } from "../../operations/types";
import { notify } from "./notify";
import { orderFacts, orderPeople } from "./order-people";

type AnyFollowUp = FollowUpInput<unknown, unknown>;

const CommentOutput = z.object({
  id: z.string(),
  orderId: z.string(),
  lineId: z.string().nullable(),
  parentCommentId: z.string().nullable(),
  body: z.string(),
  mentions: z.array(z.object({ userId: z.string() })),
});
type CommentOutput = z.infer<typeof CommentOutput>;

/** How much of a comment a notification shows (ADR 0115). */
const EXCERPT = 140;

type Scope = Pick<AnyFollowUp, "context"> & { comment: CommentOutput };

/** The order's facts plus the comment's line, start of text and whether it is a reply. */
async function commentData({ context, comment }: Scope) {
  const { orderId, lineId, body } = comment;
  const [facts, line] = await Promise.all([
    orderFacts({ context, orderId }),
    lineId
      ? context.db.line.findFirst({ where: { id: lineId }, select: { name: true } })
      : Promise.resolve(null),
  ]);
  if (!facts) return null;
  const excerpt = body.length > EXCERPT ? `${body.slice(0, EXCERPT - 1)}…` : body;
  const reply = comment.parentCommentId !== null;
  return { ...facts, commentId: comment.id, lineId, lineName: line?.name ?? null, excerpt, reply };
}

/** Everyone on the order, its creator and, for a reply, the author of the comment it answers. */
async function audience({ context, comment }: Scope) {
  const [people, record, parent] = await Promise.all([
    orderPeople({ context, orderId: comment.orderId }),
    context.db.record.findFirst({ where: { id: comment.orderId }, select: { createdBy: true } }),
    comment.parentCommentId
      ? context.db.comment.findFirst({
          where: { id: comment.parentCommentId },
          select: { createdBy: true },
        })
      : Promise.resolve(null),
  ]);
  return [...people, record?.createdBy ?? null, parent?.createdBy ?? null];
}

/**
 * `comment.create` (ADR 0115): each mentioned colleague is told they were mentioned; everyone
 * else on the order (and a reply's parent author) that a comment was added. Never the author;
 * each person gets and reads their own notification.
 */
export async function notifyCommentAdded({ output, context }: AnyFollowUp) {
  const parsed = CommentOutput.safeParse(output);
  if (!parsed.success) return;
  const comment = parsed.data;
  const data = await commentData({ context, comment });
  if (!data) return;
  const orderId = comment.orderId;
  const mentioned = comment.mentions.map((mention) => mention.userId);
  await notify({ context, kind: "COMMENT_MENTIONED", userIds: mentioned, orderId, data });
  const others = (await audience({ context, comment })).filter(
    (id) => id === null || !mentioned.includes(id),
  );
  await notify({ context, kind: "COMMENT_ADDED", userIds: others, orderId, data });
}

/** `comment.update`: colleagues mentioned now who were not told about this comment before. */
export async function notifyCommentMentions({ output, context }: AnyFollowUp) {
  const parsed = CommentOutput.safeParse(output);
  if (!parsed.success || parsed.data.mentions.length === 0) return;
  const comment = parsed.data;
  const told = await context.db.notification.findMany({
    where: {
      orderId: comment.orderId,
      kind: "COMMENT_MENTIONED",
      data: { path: ["commentId"], equals: comment.id },
    },
    select: { recipientUserId: true },
  });
  const done = new Set(told.map((row) => row.recipientUserId));
  const fresh = comment.mentions.map((m) => m.userId).filter((id) => !done.has(id));
  if (fresh.length === 0) return;
  const data = await commentData({ context, comment });
  if (!data) return;
  await notify({
    context,
    kind: "COMMENT_MENTIONED",
    userIds: fresh,
    orderId: comment.orderId,
    data,
  });
}
