import type { ProviderConnection } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import type { OperationContext } from "../operations/types";
import { getAccessToken } from "./oauth/access-token";
import type { OauthContext } from "./oauth/connection-state";
import type { ProviderKey } from "./provider-keys";
import { findProvider } from "./registry";
import type { ProviderAuth } from "./types";

type Db = { context: Pick<OperationContext, "db"> };

export type LoadConnectionInput = Db & { provider: ProviderKey };

/** The organization's connection to a provider, or null when it never started one. */
export function loadConnection({ context, provider }: LoadConnectionInput) {
  return context.db.providerConnection.findFirst({ where: { provider } });
}

export type UsableInput = { row: ProviderConnection | null };

/**
 * Whether Bibi can act on the connection now: CONNECTED and not disconnected, and a hosted account
 * has its id (ADR 0090, 0100).
 */
export function isUsable({ row }: UsableInput): boolean {
  if (!row || row.status !== "CONNECTED" || row.disconnectedAt) return false;
  const kind = findProvider({ key: row.provider })?.connect.kind;
  return kind !== "HOSTED_ONBOARDING" || row.externalAccountId !== null;
}

export type AuthForInput = { context: OauthContext; row: ProviderConnection };

/**
 * What a provider call acts with (ADR 0087): the account id and, for an OAuth provider, a fresh
 * access token. Call it only in `external`: a refresh rotates the refresh token.
 */
export async function authFor({ context, row }: AuthForInput): Promise<Result<ProviderAuth>> {
  const { provider, externalAccountId } = row;
  if (findProvider({ key: provider })?.connect.kind !== "OAUTH") {
    return ok({ value: { externalAccountId, accessToken: null } });
  }
  const token = await getAccessToken({ context, provider });
  if (!token.ok) return token;
  return ok({ value: { externalAccountId, accessToken: token.value } });
}
