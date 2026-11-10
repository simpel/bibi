import { openSecret } from "../../crypto/secret-box";
import type { Result } from "../../errors/result";
import { nowOf } from "../../time/now";
import { type OauthAccessInput, providerNotConnected } from "./connection-state";
import { refreshConnection } from "./refresh-connection";

/** Refresh when less than this is left of the access token. */
const ACCESS_MARGIN_MS = 5 * 60 * 1000;

/**
 * THE way to get an OAuth provider's access token for the organization (ADR 0087, 0100). Call it
 * only outside a transaction (an operation's `external`, ADR 0058): a refresh rotates the refresh
 * token at the provider, and a rollback would lose the new one.
 */
export async function getAccessToken({
  context,
  provider,
}: OauthAccessInput): Promise<Result<string>> {
  const row = await context.db.providerConnection.findFirst({
    where: { provider, status: "CONNECTED" },
  });
  if (!row?.accessTokenSealed || !row.accessExpiresAt) return providerNotConnected({ provider });
  if (row.accessExpiresAt.getTime() - nowOf({ context }).getTime() > ACCESS_MARGIN_MS) {
    return openSecret({ sealed: row.accessTokenSealed });
  }
  return refreshConnection({ context, row });
}
