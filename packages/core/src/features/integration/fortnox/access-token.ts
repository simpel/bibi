import { openSecret } from "../../../crypto/secret-box";
import type { Result } from "../../../errors/result";
import { nowOf } from "../../../time/now";
import { type FortnoxAccessInput, fortnoxNotConnected } from "./connection-state";
import { refreshFortnoxConnection } from "./refresh-connection";

/** Refresh when less than this is left of the access token. */
const ACCESS_MARGIN_MS = 5 * 60 * 1000;

/**
 * THE way to get a Fortnox access token for the organization (ADR 0087). Call it only outside a
 * transaction (an operation's `external`, ADR 0058): a refresh rotates the refresh token at
 * Fortnox, and a rollback would lose the new one.
 */
export async function getFortnoxAccessToken({
  context,
}: FortnoxAccessInput): Promise<Result<string>> {
  const row = await context.db.integrationConnection.findFirst({
    where: { provider: "FORTNOX", status: "CONNECTED" },
  });
  if (!row?.accessTokenSealed || !row.accessExpiresAt) return fortnoxNotConnected();
  if (row.accessExpiresAt.getTime() - nowOf({ context }).getTime() > ACCESS_MARGIN_MS) {
    return openSecret({ sealed: row.accessTokenSealed });
  }
  return refreshFortnoxConnection({ context, row });
}
