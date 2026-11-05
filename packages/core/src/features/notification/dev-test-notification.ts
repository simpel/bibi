import { getEnv } from "@bibi/config";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { grantAll } from "../../permissions/permission-set";
import { notFound } from "../../shared/errors";
import { notify } from "./notify";
import { orderFacts } from "./order-people";
import type { NotificationData, NotificationKind } from "./schema";

export type SendTestNotificationInput = { organizationId: string; userId: string };

type Extra = { kind: NotificationKind; data: NotificationData };

const pick = <T>({ list }: { list: readonly T[] }) =>
  list[Math.floor(Math.random() * list.length)] as T;

/** A random kind with made-up facts of its own; the order's facts are added on top. */
const EXTRAS: readonly Extra[] = [
  { kind: "ASSIGNED", data: {} },
  { kind: "ORDER_STATUS_CHANGED", data: { fromStatus: "Quote sent", toStatus: "Confirmed" } },
  { kind: "PAYMENT_RECEIVED", data: { amountMinor: 1_250_000, currency: "SEK" } },
];

/**
 * Development only (the dev menu): tells `userId` about a random order of the organization with
 * a random kind, through `notify` like a real command, so the stream and the bell react. Refuses
 * production. Respects the member's preferences, so a turned-off kind sends nothing.
 */
export async function sendTestNotification({
  organizationId,
  userId,
}: SendTestNotificationInput): Promise<Result<{ kind: NotificationKind }>> {
  if (getEnv().NODE_ENV === "production") {
    return err({ error: new AppError({ code: "FORBIDDEN", message: "Dev only" }) });
  }
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({}),
    actor: { type: "system", userId: null },
  });
  const count = await context.db.order.count();
  const order = await context.db.order.findFirst({
    skip: Math.floor(Math.random() * count),
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (!order) return notFound({ entity: "Order" });
  const facts = await orderFacts({ context, orderId: order.id });
  const { kind, data } = pick({ list: EXTRAS });
  // Like a command's `followUp`: nothing is audited for a notification.
  const run = { ...context, recordChange: () => {} };
  const input = { kind, userIds: [userId], orderId: order.id, data: { ...facts, ...data } };
  await notify({ context: run, ...input });
  return ok({ value: { kind } });
}
