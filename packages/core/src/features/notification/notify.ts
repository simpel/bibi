import type { Prisma } from "@bibi/db";
import { createExecuteContext } from "../../operations/context";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { reachableRecipients } from "./recipient-access";
import type { NotificationData, NotificationKind } from "./schema";

export type NotifyInput = {
  context: OperationContext;
  kind: NotificationKind;
  /** Everyone the event concerns; the actor, duplicates and unreachable members are dropped. */
  userIds: readonly (string | null)[];
  orderId: string;
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
};

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
 * see the order (and the run sheet or payment it names) and want this kind.
 */
export async function notify({ context, kind, userIds, data, ...subject }: NotifyInput) {
  const actorUserId = context.actor.userId;
  const wanted = [...new Set(userIds.filter((id): id is string => !!id && id !== actorUserId))];
  const recipients = await reachableRecipients({
    ...{ context, userIds: wanted, kind, needs: NEEDS[kind] },
  });
  if (recipients.length === 0) return;
  const system = createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: {},
    actor: { type: "system", userId: null },
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
