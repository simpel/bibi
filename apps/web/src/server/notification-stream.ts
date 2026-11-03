import "server-only";
import { resolveExecuteContext } from "@bibi/auth";
import type { ExecuteContext } from "@bibi/core";
import { getLogContext, runWithLogContext, withRequestLogging } from "@bibi/logger";
import { liveEventFor } from "./live-event";
import { type LiveChangeInput, subscribeToNotifications } from "./notification-listener";
import { ensureOperations } from "./operations";

/** A comment line keeps proxies from closing an idle stream. */
const HEARTBEAT_MS = 25_000;
/** The stream ends after this; the browser reconnects and the session is checked again. */
const LIFETIME_MS = 30 * 60_000;

const encoder = new TextEncoder();

type Controller = ReadableStreamDefaultController<Uint8Array>;

type SendInput = LiveChangeInput & { context: ExecuteContext; controller: Controller };

/** Sends the changed count as an `unread` or `inbox` event. */
async function sendCount({ context, controller, change, arrivedId }: SendInput) {
  const event = await liveEventFor({ context, change, arrivedId });
  if (!event) return;
  const data = JSON.stringify(event.data);
  controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${data}\n\n`));
}

type OpenInput = { context: ExecuteContext; signal: AbortSignal; controller: Controller };
type Stop = { stop: () => void };

/**
 * Sends a count; pushes start from the listener's callbacks, so they run in the log context
 * of the request that opened the stream.
 */
function pusher({ context, controller, stop }: Omit<OpenInput, "signal"> & Stop) {
  const logContext = getLogContext();
  return ({ change, arrivedId }: LiveChangeInput) => {
    const send = () => sendCount({ context, controller, change, arrivedId }).catch(() => stop());
    void (logContext ? runWithLogContext({ context: logContext, fn: send }) : send());
  };
}

/** A comment line; a closed stream stops instead of throwing in the timer. */
const pinger =
  ({ controller, stop }: Pick<OpenInput, "controller"> & Stop) =>
  () => {
    try {
      controller.enqueue(encoder.encode(": ping\n\n"));
    } catch {
      stop();
    }
  };

/** Subscribes, sends the first count and starts the heartbeat and lifetime; returns the stop. */
function openStream({ context, signal, controller }: OpenInput) {
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    unsubscribe();
    clearInterval(heartbeat);
    clearTimeout(lifetime);
    try {
      controller.close();
    } catch {}
  };
  const push = pusher({ context, controller, stop });
  const unsubscribe = subscribeToNotifications({
    organizationId: context.organizationId,
    userId: context.actor.userId ?? "",
    onChange: push,
  });
  const heartbeat = setInterval(pinger({ controller, stop }), HEARTBEAT_MS);
  const lifetime = setTimeout(stop, LIFETIME_MS);
  signal.addEventListener("abort", stop);
  push({ change: "notification" });
  push({ change: "inbox" });
  return stop;
}

/** The event stream: both counts on connect and on every change, heartbeats, and a set lifetime. */
function unreadStream({ context, signal }: { context: ExecuteContext; signal: AbortSignal }) {
  let stop = () => {};
  return new ReadableStream<Uint8Array>({
    start: (controller) => {
      stop = openStream({ context, signal, controller });
    },
    cancel: () => stop(),
  });
}

/**
 * `GET /api/notifications/stream` (ADR 0094): Server-Sent Events with the signed-in member's
 * unread count and the inbox's open count, pushed when the database signals a change. Only for a
 * user (no API keys).
 */
export const notificationStreamResponse = withRequestLogging({
  surface: "web",
  handler: async (request) => {
    ensureOperations();
    const context = await resolveExecuteContext({ headers: request.headers });
    if (!context.ok || !context.value.actor.userId) return new Response(null, { status: 401 });
    // The page's organization: another tab may have made a different one active (ADR 0062).
    // 204 tells EventSource to stop instead of streaming that organization's count.
    const org = new URL(request.url).searchParams.get("org");
    if (org && org !== context.value.organizationId) return new Response(null, { status: 204 });
    return new Response(unreadStream({ context: context.value, signal: request.signal }), {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  },
});
