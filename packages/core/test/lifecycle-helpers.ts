import { createId } from "@paralleldrive/cuid2";
import {
  applyProviderDelivery,
  type ExecuteContext,
  type ProviderKey,
  type ProviderSignal,
} from "../src/index";
import { unwrap } from "./helpers";

export type SendSignalInput = {
  context: ExecuteContext;
  provider: ProviderKey;
  signal: Omit<ProviderSignal, "provider" | "eventId" | "externalAccountId" | "occurredAt">;
  eventId?: string;
};

/** Delivers one provider signal as the provider's webhook would (ADR 0100); returns its status. */
export async function sendSignal({
  context,
  provider,
  signal,
  eventId = createId(),
}: SendSignalInput) {
  const connection = await context.db.providerConnection.findFirstOrThrow({ where: { provider } });
  const full: ProviderSignal = {
    ...signal,
    provider,
    eventId,
    externalAccountId: connection.externalAccountId,
    occurredAt: new Date(),
  };
  const delivery = { eventId, type: signal.kind, signals: [full] };
  return unwrap({ result: await applyProviderDelivery({ provider, delivery }) }).status;
}
