import {
  type FortnoxTenantToken,
  fortnoxStreamSecret,
  fortnoxTenantTokens,
  loadFortnoxOffsets,
  rememberFortnoxTenant,
} from "@bibi/core";
import { getLogger } from "@bibi/logger";

/** What the session sends; `send` is the open socket's. */
export type Send = (message: Record<string, unknown>) => void;

/** `add-tenants-v1` for these companies (ADR 0090); returns the tokens to match the answer. */
export async function addTenants({ send, onlyNew }: { send: Send; onlyNew: boolean }) {
  const clientSecret = fortnoxStreamSecret();
  const tokens = await fortnoxTenantTokens({ onlyNew });
  if (!clientSecret || tokens.length === 0) return tokens;
  send({
    command: "add-tenants-v1",
    includeChildTenants: false,
    clientSecret,
    accessTokens: tokens.map((t) => `Bearer ${t.accessToken}`),
  });
  return tokens;
}

export type TenantAnswerInput = {
  tenantIds: Record<string, number>;
  pending: readonly FortnoxTenantToken[];
};

/** Stores the tenant id of each company Fortnox accepted. */
export async function rememberTenants({ tenantIds, pending }: TenantAnswerInput) {
  for (const { organizationId, accessToken } of pending) {
    const tenantId = tenantIds[`Bearer ${accessToken}`];
    if (tenantId !== undefined) await rememberFortnoxTenant({ organizationId, tenantId });
    else getLogger().warn({ event: "fortnox.tenantRefused", organizationId });
  }
}

/** `add-tenants` answered: the `invoices` topic from where the stream stopped, then subscribe. */
export async function subscribe({ send }: { send: Send }) {
  const offsets = await loadFortnoxOffsets();
  const stored = offsets.find((row) => row.topic === "invoices");
  send({
    command: "add-topics-v1",
    topics: [{ topic: "invoices", ...(stored ? { offset: stored.offset } : {}) }],
  });
  send({ command: "subscribe-v1" });
}
