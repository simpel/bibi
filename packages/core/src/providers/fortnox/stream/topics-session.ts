import { randomUUID } from "node:crypto";
import { getLogger, runWithLogContext } from "@bibi/logger";
import { FortnoxTopicEventSchema, handleFortnoxEvent } from "./events";
import { type FortnoxTenantToken, saveFortnoxOffset } from "./tenants";
import { addTenants, rememberTenants, type Send, subscribe } from "./topics-protocol";

type Message = Record<string, unknown>;

/** Runs one stream event in its own log context and remembers its offset afterwards. */
async function onEvent({ message }: { message: Message }) {
  const parsed = FortnoxTopicEventSchema.safeParse(message);
  if (!parsed.success) return;
  const event = parsed.data;
  await runWithLogContext({
    context: { requestId: randomUUID(), surface: "system" },
    fn: async () => {
      const outcome = await handleFortnoxEvent({ event });
      getLogger().info({ event: "fortnox.eventHandled", type: event.type, outcome });
    },
  });
  // At-least-once and ordered: a failed sync is logged; Refresh or the next event repairs it.
  await saveFortnoxOffset({ topic: event.topic, offset: event.offset });
}

/**
 * One open Topics connection (ADR 0090): adds every connected company, subscribes to `invoices`
 * and handles events strictly in order. `addNew` adds companies connected since.
 */
export function createTopicsSession({ send }: { send: Send }) {
  let pending: FortnoxTenantToken[] = [];
  let subscribed = false;
  let queue = Promise.resolve();
  const onAnswer = async ({ message }: { message: Message }) => {
    if (message.response !== "add-tenants-v1") return;
    const tenantIds = (message.tenantIds ?? {}) as Record<string, number>;
    await rememberTenants({ tenantIds, pending });
    if (!subscribed) await subscribe({ send });
    subscribed = true;
  };
  const receive = ({ message }: { message: Message }) => {
    queue = queue
      .then(() => ("topic" in message ? onEvent({ message }) : onAnswer({ message })))
      .catch((error: unknown) => getLogger().error({ event: "fortnox.messageFailed", err: error }));
  };
  const start = async () => {
    pending = await addTenants({ send, onlyNew: false });
    return pending.length > 0;
  };
  const addNew = async () => {
    pending = await addTenants({ send, onlyNew: true });
  };
  return { start, receive, addNew };
}
