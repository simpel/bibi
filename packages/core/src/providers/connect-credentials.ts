import type { ProviderConnection } from "@bibi/db";
import { sealSecret } from "../crypto/secret-box";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import type { OperationContext } from "../operations/types";
import { conflict } from "../shared/errors";
import { nowOf } from "../time/now";
import type { CredentialsConnectPort } from "./connect-types";
import type { ProviderKey } from "./provider-keys";
import { getProvider } from "./registry";

/** The provider's credentials port; CONFLICT for one that connects another way. */
export function credentialsPortOf({ key }: { key: ProviderKey }): Result<CredentialsConnectPort> {
  const adapter = getProvider({ key });
  if (!adapter.ok) return adapter;
  if (!adapter.value.isConfigured()) {
    const message = `${key} is not configured (INTEGRATION_SECRET_KEY).`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  const { connect } = adapter.value;
  if (connect.kind !== "CREDENTIALS")
    return conflict({ message: `${key} does not connect by credentials` });
  return ok({ value: connect });
}

export type ConnectWithCredentialsInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "actor" | "now"> &
    Partial<Pick<OperationContext, "recordChange">>;
  provider: ProviderKey;
  credentials: Record<string, unknown>;
};

const auditImage = ({ row }: { row: ProviderConnection }) => ({
  id: row.id,
  provider: row.provider,
  status: row.status,
  externalAccountId: row.externalAccountId,
});

/**
 * Connects a CREDENTIALS provider (ADR 0100): checks the input against the port's schema, has
 * the provider verify it, then stores it sealed (`INTEGRATION_SECRET_KEY`) as the CONNECTED
 * connection with the account id the provider confirmed. Run it outside a transaction (an
 * operation's `external`): `verify` calls the provider. Credentials never reach an output or log.
 */
export async function connectWithCredentials({
  context,
  provider,
  credentials,
}: ConnectWithCredentialsInput): Promise<Result<ProviderConnection>> {
  const port = credentialsPortOf({ key: provider });
  if (!port.ok) return port;
  const parsed = port.value.credentialsSchema.safeParse(credentials);
  if (!parsed.success) {
    return err({
      error: new AppError({ code: "VALIDATION", message: `Invalid ${provider} credentials` }),
    });
  }
  const verified = await port.value.verify({ credentials: parsed.data });
  if (!verified.ok) return verified;
  const sealed = sealSecret({ plain: JSON.stringify(parsed.data) });
  if (!sealed.ok) return sealed;
  const data = {
    status: "CONNECTED" as const,
    externalAccountId: verified.value.externalAccountId,
    credentialsSealed: sealed.value,
    disconnectedAt: null,
    connectedAt: nowOf({ context }),
    connectedBy: context.actor.userId,
  };
  const before = await context.db.providerConnection.findFirst({ where: { provider } });
  const write = before
    ? context.db.providerConnection.update({ where: { id: before.id }, data })
    : context.db.providerConnection.create({
        data: { organizationId: context.organizationId, provider, ...data },
      });
  // Unique (provider, externalAccountId): the account belongs to another organization.
  const row = await write.catch((error: unknown) => {
    if ((error as { code?: unknown } | null)?.code === "P2002") return null;
    throw error;
  });
  if (!row) return conflict({ message: `That ${provider} account is already connected elsewhere` });
  context.recordChange?.({
    entityId: row.id,
    ...(before ? { before: auditImage({ row: before }) } : {}),
    after: auditImage({ row }),
  });
  return ok({ value: row });
}
