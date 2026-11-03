import { type NotificationWire, NotificationWireSchema } from "@bibi/core/schemas";
import { useEffect, useRef } from "react";
import { z } from "zod";
import { openSharedEventSource } from "@/lib/shared-event-source";

/**
 * The stream route (ADR 0094): sends `unread` (`{ unread, arrived }`) and, with `inbox:read`,
 * `inbox` (`{ open, arrived }`) on connect and whenever either changes.
 */
export const NOTIFICATION_STREAM_PATH = "/api/notifications/stream";

/** A new inbox message as the stream names it, for the toast. Written by an outside sender. */
const ArrivedMessageSchema = z.object({
  id: z.string(),
  subject: z.string().nullable(),
  sender: z.string().nullable(),
});
export type ArrivedMessage = z.infer<typeof ArrivedMessageSchema>;

const UnreadEventSchema = z.object({
  unread: z.number(),
  arrived: NotificationWireSchema.nullable().catch(null),
});
const InboxEventSchema = z.object({
  open: z.number(),
  arrived: ArrivedMessageSchema.nullable().catch(null),
});

/** An event's JSON checked against its schema, or null for anything else. */
function parse<T>({ data, schema }: { data: string; schema: z.ZodType<T> }): T | null {
  try {
    const parsed = schema.safeParse(JSON.parse(data));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type LiveCountsHandlers = {
  /** `arrived`: the notification that just came in, if one did (not a read or unread mark). */
  onUnread: (input: { unread: number; arrived: NotificationWire | null }) => void;
  /** `arrived`: the inbox message that just came in, if one did. */
  onInbox: (input: { open: number; arrived: ArrivedMessage | null }) => void;
};

/**
 * Hands every count the stream sends to its handler, over one connection per browser and
 * organization (`openSharedEventSource`). EventSource reconnects on its own.
 */
export function useNotificationStream({
  organizationId,
  ...handlers
}: LiveCountsHandlers & { organizationId: string }) {
  const callback = useRef(handlers);
  callback.current = handlers;
  useEffect(() => {
    const query = new URLSearchParams({ org: organizationId });
    return openSharedEventSource({
      name: `bibi-notifications:${organizationId}`,
      url: `${NOTIFICATION_STREAM_PATH}?${query}`,
      types: ["unread", "inbox"],
      onEvent: ({ type, data }) => {
        if (type === "inbox") {
          const event = parse({ data, schema: InboxEventSchema });
          if (event) callback.current.onInbox(event);
          return;
        }
        const event = parse({ data, schema: UnreadEventSchema });
        if (event) callback.current.onUnread(event);
      },
    });
  }, [organizationId]);
}
