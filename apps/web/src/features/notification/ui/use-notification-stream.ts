import { useEffect, useRef } from "react";
import { openSharedEventSource } from "@/lib/shared-event-source";

/**
 * The stream route (ADR 0094): sends `unread` (`{ unread }`) and, with `inbox:read`, `inbox`
 * (`{ open }`) on connect and whenever either changes.
 */
export const NOTIFICATION_STREAM_PATH = "/api/notifications/stream";

/** The count under `key` in an event's JSON, or null for anything else. */
const parse = ({ data, key }: { data: string; key: string }) => {
  try {
    const value = (JSON.parse(data) as Record<string, unknown> | null)?.[key];
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
};

export type LiveCountsHandlers = {
  onUnread: (unread: number) => void;
  onInbox: (open: number) => void;
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
        const count = parse({ data, key: type === "inbox" ? "open" : "unread" });
        if (count === null) return;
        if (type === "inbox") callback.current.onInbox(count);
        else callback.current.onUnread(count);
      },
    });
  }, [organizationId]);
}
