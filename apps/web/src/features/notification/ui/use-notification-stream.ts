import { useEffect, useRef } from "react";
import { openSharedEventSource } from "@/lib/shared-event-source";

/** The stream route (ADR 0094): sends `{ unread }` on connect and whenever it changes. */
export const NOTIFICATION_STREAM_PATH = "/api/notifications/stream";

const parse = ({ data }: { data: string }) => {
  try {
    const unread = (JSON.parse(data) as { unread?: unknown })?.unread;
    return typeof unread === "number" ? unread : null;
  } catch {
    return null;
  }
};

/**
 * Calls `onUnread` with every count the stream sends, over one connection per browser and
 * organization (`openSharedEventSource`). EventSource reconnects on its own.
 */
export function useNotificationStream({
  organizationId,
  onUnread,
}: {
  organizationId: string;
  onUnread: (unread: number) => void;
}) {
  const callback = useRef(onUnread);
  callback.current = onUnread;
  useEffect(() => {
    const query = new URLSearchParams({ org: organizationId });
    return openSharedEventSource({
      name: `bibi-notifications:${organizationId}`,
      url: `${NOTIFICATION_STREAM_PATH}?${query}`,
      types: ["unread"],
      onEvent: ({ data }) => {
        const unread = parse({ data });
        if (unread !== null) callback.current(unread);
      },
    });
  }, [organizationId]);
}
