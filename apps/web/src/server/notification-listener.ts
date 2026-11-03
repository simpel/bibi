import "server-only";
import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import pg from "pg";
import { z } from "zod";

/**
 * The triggers' channels and payloads (ADR 0094): `notify_notification.sql` names the member,
 * `notify_inbox.sql` only the organization, since the inbox is shared. `arrivedId` is the id of
 * a row that just came in (a new notification, a new inbox message), null for any other change.
 */
const CHANNELS = ["notification", "inbox"] as const;
const PayloadSchema = z.object({
  organizationId: z.string(),
  recipientUserId: z.string().optional(),
  arrivedId: z.string().nullable().optional(),
});

const RECONNECT_MS = 5_000;

/** Which of the member's counts changed. */
export type LiveChange = (typeof CHANNELS)[number];

/** What changed, and the id of the row that just came in, if one did. */
export type LiveChangeInput = { change: LiveChange; arrivedId?: string | undefined };

type OnChange = (input: LiveChangeInput) => void;

type Hub = { subscribers: Map<string, Set<OnChange>>; client: pg.Client | null };

const holder = globalThis as typeof globalThis & { __bibiNotificationHub?: Hub };

const keyOf = ({ organizationId, userId }: { organizationId: string; userId: string }) =>
  `${organizationId}:${userId}`;

function hub(): Hub {
  holder.__bibiNotificationHub ??= { subscribers: new Map(), client: null };
  return holder.__bibiNotificationHub;
}

/** The payload's member, or null for anything else someone sent on the channel. */
function parsePayload({ payload }: { payload: string | undefined }) {
  try {
    const parsed = PayloadSchema.safeParse(JSON.parse(payload ?? "null"));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** A member's notification wakes that member's streams; an inbox change every stream of the org. */
function dispatch({ channel, payload }: { channel: string; payload: string | undefined }) {
  const target = parsePayload({ payload });
  if (!target) return;
  const { organizationId, recipientUserId } = target;
  const arrivedId = target.arrivedId ?? undefined;
  if (channel === "notification" && recipientUserId) {
    const key = keyOf({ organizationId, userId: recipientUserId });
    for (const onChange of hub().subscribers.get(key) ?? [])
      onChange({ change: "notification", arrivedId });
    return;
  }
  if (channel !== "inbox") return;
  for (const [key, set] of hub().subscribers) {
    if (key.startsWith(`${organizationId}:`))
      for (const onChange of set) onChange({ change: "inbox", arrivedId });
  }
}

/** Every open stream re-reads its counts: changes may have been missed while disconnected. */
const pushAll = () => {
  for (const set of hub().subscribers.values()) {
    for (const onChange of set) for (const change of CHANNELS) onChange({ change });
  }
};

/** A dropped connection is closed and replaced while anyone still listens. */
function drop({ client, error }: { client: pg.Client; error?: unknown }) {
  const state = hub();
  if (state.client !== client) return;
  state.client = null;
  void client.end().catch(() => undefined);
  getLogger().warn({ event: "notification.listenDropped", err: error });
  setTimeout(() => {
    if (state.subscribers.size > 0) void connect();
  }, RECONNECT_MS);
}

/** One `LISTEN` connection per server process, shared by every open stream. */
async function connect() {
  const state = hub();
  if (state.client) return;
  const client = new pg.Client({ connectionString: getEnv().DATABASE_URL });
  state.client = client;
  client.on("notification", (message) =>
    dispatch({ channel: message.channel, payload: message.payload }),
  );
  client.on("error", (error) => drop({ client, error }));
  client.on("end", () => drop({ client }));
  try {
    await client.connect();
    for (const channel of CHANNELS) await client.query(`LISTEN ${channel}`);
    pushAll();
  } catch (error) {
    drop({ client, error });
  }
}

export type SubscribeInput = { organizationId: string; userId: string; onChange: OnChange };

/** Calls `onChange` when the member's notifications or the org's inbox change; returns the unsubscribe. */
export function subscribeToNotifications({ organizationId, userId, onChange }: SubscribeInput) {
  const { subscribers } = hub();
  const key = keyOf({ organizationId, userId });
  const set = subscribers.get(key) ?? new Set<OnChange>();
  set.add(onChange);
  subscribers.set(key, set);
  void connect();
  return () => {
    set.delete(onChange);
    if (set.size === 0) subscribers.delete(key);
  };
}
