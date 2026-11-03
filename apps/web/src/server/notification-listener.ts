import "server-only";
import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import pg from "pg";
import { z } from "zod";

/** The trigger's channel and payload (`notify_notification.sql`, ADR 0094). */
const CHANNEL = "notification";
const PayloadSchema = z.object({ organizationId: z.string(), recipientUserId: z.string() });

const RECONNECT_MS = 5_000;

type OnChange = () => void;

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

function dispatch({ payload }: { payload: string | undefined }) {
  const member = parsePayload({ payload });
  if (!member) return;
  const key = keyOf({ organizationId: member.organizationId, userId: member.recipientUserId });
  for (const onChange of hub().subscribers.get(key) ?? []) onChange();
}

/** Every open stream re-reads its count: changes may have been missed while disconnected. */
const pushAll = () => {
  for (const set of hub().subscribers.values()) for (const onChange of set) onChange();
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
  client.on("notification", (message) => dispatch({ payload: message.payload }));
  client.on("error", (error) => drop({ client, error }));
  client.on("end", () => drop({ client }));
  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
    pushAll();
  } catch (error) {
    drop({ client, error });
  }
}

export type SubscribeInput = { organizationId: string; userId: string; onChange: OnChange };

/** Calls `onChange` whenever the member's notifications change; returns the unsubscribe. */
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
