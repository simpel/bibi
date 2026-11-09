import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { getAccessToken } from "../../oauth/access-token";
import { providerSystemContext } from "../../system-context";

export type FortnoxTenantToken = { organizationId: string; accessToken: string };

export type TenantTokensInput = { db?: Db; onlyNew?: boolean };

/**
 * An access token for every connected Fortnox company (ADR 0090), for `add-tenants-v1` on the
 * worker's one Topics stream. `onlyNew`: only companies the stream has no tenant id for yet.
 * A company whose token cannot be had is skipped and logged.
 */
export async function fortnoxTenantTokens({
  db = getDb(),
  onlyNew = false,
}: TenantTokensInput = {}): Promise<FortnoxTenantToken[]> {
  const rows = await db.providerConnection.findMany({
    where: {
      provider: "FORTNOX",
      status: "CONNECTED",
      ...(onlyNew ? { externalAccountId: null } : {}),
    },
    select: { organizationId: true },
  });
  const tokens: FortnoxTenantToken[] = [];
  for (const { organizationId } of rows) {
    const context = providerSystemContext({ db, organizationId });
    const token = await getAccessToken({ context, provider: "FORTNOX" });
    if (token.ok) tokens.push({ organizationId, accessToken: token.value });
    else getLogger().warn({ event: "fortnox.tenantSkipped", organizationId, err: token.error });
  }
  return tokens;
}

export type RememberTenantInput = { db?: Db; organizationId: string; tenantId: number };

/** Stores the tenant id Fortnox gave the company, so its stream events find the organization. */
export async function rememberFortnoxTenant({
  db = getDb(),
  organizationId,
  tenantId,
}: RememberTenantInput): Promise<void> {
  await db.providerConnection.updateMany({
    where: { organizationId, provider: "FORTNOX" },
    data: { externalAccountId: String(tenantId) },
  });
}

/** Where the stream stopped per topic; Fortnox replays from there (up to 14 days). */
export async function loadFortnoxOffsets({ db = getDb() }: { db?: Db } = {}) {
  return db.providerStreamOffset.findMany({ where: { provider: "FORTNOX" } });
}

export type SaveOffsetInput = { db?: Db; topic: string; offset: string };

export async function saveFortnoxOffset({ db = getDb(), topic, offset }: SaveOffsetInput) {
  const provider = "FORTNOX" as const;
  await db.providerStreamOffset.upsert({
    where: { provider_topic: { provider, topic } },
    create: { provider, topic, offset },
    update: { offset },
  });
}
