import { fortnoxStreamSecret } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { createTopicsSession } from "./topics-session";

const TOPICS_URL = "wss://ws.fortnox.se/topics-v1";
/** Companies connected since the stream opened are added this often. */
const ADD_NEW_MS = 10 * 60 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;

export type TopicsStream = { stop: () => void };

/**
 * The worker's one Fortnox Topics connection for every organization (ADR 0090): reconnects with
 * a growing delay, and waits while no company is connected or Fortnox is not configured.
 */
export function startFortnoxStream(): TopicsStream {
  let stopped = false;
  let socket: WebSocket | null = null;
  let timer: NodeJS.Timeout | null = null;
  let backoff = 5_000;
  const later = ({ ms }: { ms: number }) => {
    if (!stopped) timer = setTimeout(open, ms);
  };
  function open() {
    const ws = new WebSocket(TOPICS_URL);
    socket = ws;
    const session = createTopicsSession({ send: (message) => ws.send(JSON.stringify(message)) });
    const addNew = setInterval(() => void session.addNew(), ADD_NEW_MS);
    ws.onopen = async () => {
      if (await session.start()) {
        backoff = 5_000;
        getLogger().info({ event: "fortnox.streamConnected" });
      } else ws.close();
    };
    ws.onmessage = (message) => session.receive({ message: JSON.parse(String(message.data)) });
    ws.onclose = () => {
      clearInterval(addNew);
      getLogger().info({ event: "fortnox.streamClosed", retryInMs: backoff });
      later({ ms: backoff });
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
    };
    ws.onerror = () => getLogger().warn({ event: "fortnox.streamError" });
  }
  // Without Fortnox app credentials there is nothing to stream.
  if (fortnoxStreamSecret()) open();
  return {
    stop: () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      socket?.close();
    },
  };
}
