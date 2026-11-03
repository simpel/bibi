import { useEffect, useState } from "react";

/** The stream route (ADR 0094): sends `{ unread }` on connect and whenever it changes. */
export const NOTIFICATION_STREAM_PATH = "/api/notifications/stream";

type Message = { unread: number };

const parse = ({ data }: { data: string }): Message | null => {
  try {
    const value: unknown = JSON.parse(data);
    const unread = (value as Partial<Message>)?.unread;
    return typeof unread === "number" ? { unread } : null;
  } catch {
    return null;
  }
};

/**
 * The caller's live unread count (the server-rendered `initial` until the stream says otherwise)
 * and `changes`, which counts the updates since the page loaded, so stale lists know to re-render.
 * EventSource reconnects on its own; while it is down the last count stays.
 */
export function useNotificationStream({
  initial,
  organizationId,
}: {
  initial: number;
  organizationId: string;
}) {
  const [state, setState] = useState({ unread: initial, changes: 0 });
  useEffect(() => setState((current) => ({ ...current, unread: initial })), [initial]);
  useEffect(() => {
    const query = new URLSearchParams({ org: organizationId });
    const source = new EventSource(`${NOTIFICATION_STREAM_PATH}?${query}`);
    source.addEventListener("unread", (event) => {
      const message = parse({ data: (event as MessageEvent<string>).data });
      if (message) setState(({ changes }) => ({ unread: message.unread, changes: changes + 1 }));
    });
    return () => source.close();
  }, [organizationId]);
  return state;
}
