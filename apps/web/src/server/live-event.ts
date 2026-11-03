import "server-only";
import {
  countOpenInboundMessages,
  countUnreadNotifications,
  type ExecuteContext,
  execute,
  getInboundMessage,
  listNotifications,
} from "@bibi/core";
import { senderOf } from "@/features/inbound-message/ui/message-value";
import type { LiveChangeInput } from "./notification-listener";

export type LiveEvent = { type: "unread" | "inbox"; data: Record<string, unknown> };

type EventForInput = LiveChangeInput & { context: ExecuteContext };

/** The new inbox message as the caller may read it, for the toast; null if it cannot be read. */
async function arrivedMessage({ context, id }: { context: ExecuteContext; id: string }) {
  const result = await execute({ operation: getInboundMessage, input: { id }, context });
  if (!result.ok) return null;
  const message = result.value;
  return { id, subject: message.subject, sender: senderOf({ message }) };
}

/** The new notification among the caller's newest, for the toast; null if it is not there. */
async function arrivedNotification({ context, id }: { context: ExecuteContext; id: string }) {
  const input = { limit: 5 };
  const result = await execute({ operation: listNotifications, input, context });
  return result.ok ? (result.value.items.find((item) => item.id === id) ?? null) : null;
}

/**
 * The event for one change (ADR 0094): the caller's unread count or the inbox's open count, and
 * `arrived` when a row just came in, so the browser can toast it. Untrusted sender text stays
 * plain text.
 */
export async function liveEventFor({ context, change, arrivedId }: EventForInput) {
  if (change === "notification") {
    const result = await execute({ operation: countUnreadNotifications, input: {}, context });
    if (!result.ok) return null;
    const arrived = arrivedId ? await arrivedNotification({ context, id: arrivedId }) : null;
    return { type: "unread", data: { unread: result.value.unread, arrived } } satisfies LiveEvent;
  }
  // Without `inbox:read` the operation refuses and the member gets no inbox events.
  const result = await execute({ operation: countOpenInboundMessages, input: {}, context });
  if (!result.ok) return null;
  const arrived = arrivedId ? await arrivedMessage({ context, id: arrivedId }) : null;
  return { type: "inbox", data: { open: result.value.open, arrived } } satisfies LiveEvent;
}
