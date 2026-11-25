import type { Prisma } from "@bibi/db";
import { createSystemContext } from "../../operations/context";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { reachableRecipients } from "./recipient-access";
import type { NotificationData, NotificationKind } from "./schema";

export type NotifyInput = {
  context: OperationContext;
  kind: NotificationKind;
  /** Everyone the event concerns; the actor, duplicates and unreachable members are dropped. */
  userIds: readonly (string | null)[];
  /** The subject: an order, or a task (ADR 0117) that may have no order. */
  orderId?: string;
  taskId?: string;
  runSheetId?: string;
  paymentId?: string;
  data: NotificationData;
};

/** What a recipient must be able to read: the order, and the feature the snapshot copies from. */
const NEEDS: Record<NotificationKind, readonly Permission[]> = {
  ASSIGNED: ["order:read"],
  ORDER_STATUS_CHANGED: ["order:read"],
  RUN_SHEET_SENT: ["order:read", "runSheet:read"],
  PAYMENT_RECEIVED: ["order:read", "payment:read"],
  COMMENT_ADDED: ["order:read", "comment:read"],
  COMMENT_MENTIONED: ["order:read", "comment:read"],
};

/** A task's notification (no order) needs the task instead of the order (ADR 0117). */
const needsOf = ({ kind, orderId }: { kind: NotificationKind; orderId: string | undefined }) =>
  orderId ? NEEDS[kind] : (["task:read"] as const);

/** The acting member's name for the snapshot; none for the system or an API key. */
async function actorName({ context }: { context: OperationContext }) {
  const userId = context.actor.userId;
  if (!userId) return undefined;
  const member = await context.db.member.findFirst({
    where: { userId },
    select: { user: { select: { name: true } } },
  });
  return member?.user.name || undefined;
}

/**
 * Tells members that something concerns them (ADR 0094). Runs in a command's `followUp`: the
 * rows are written as the system, never for the member who acted, and only for members who may
 * see the order (and the run sheet or payment it names), or the task, and want this kind.
 */
export async function notify({ context, kind, userIds, data, ...subject }: NotifyInput) {
  const actorUserId = context.actor.userId;
  const wanted = [...new Set(userIds.filter((id): id is string => !!id && id !== actorUserId))];
  const recipients = await reachableRecipients({
    ...{ context, userIds: wanted, kind, needs: needsOf({ kind, orderId: subject.orderId }) },
  });
  if (recipients.length === 0) return;
  const system = createSystemContext({
    organizationId: context.organizationId,
    permissions: {},
  });
  const snapshot = { ...data, actorName: await actorName({ context }) };
  await system.db.notification.createMany({
    data: recipients.map((recipientUserId) => ({
      ...{ organizationId: context.organizationId, recipientUserId, kind, actorUserId },
      ...subject,
      data: snapshot as Prisma.InputJsonValue,
    })),
  });
}
