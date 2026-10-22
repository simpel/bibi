import { ok, type Result } from "@bibi/core";
import { authorizeCode } from "./authorize-code";
import type { FirstPartyClient } from "./clients";
import { resolveClient } from "./endpoints";
import { exchangeCode } from "./exchange-code";
import { createPkcePair } from "./pkce";
import { readCachedToken, storeToken, tokenCacheKey } from "./token-cache";

export type GetFirstPartyAccessTokenInput = {
  /** Registry key in `FIRST_PARTY_CLIENTS`, e.g. `assistant`. */
  client: FirstPartyClient;
  /** The user's request headers (session cookie). */
  headers: Headers;
  /** Verified caller from `resolveExecuteContext` (cache key; the token is for this user+org). */
  caller: { userId: string; organizationId: string };
};

/** Mints (or reuses) an MCP access token for the signed-in user, as an Bibi first-party client. */
export type GetFirstPartyAccessToken = (
  input: GetFirstPartyAccessTokenInput,
) => Promise<Result<string>>;

/**
 * OAuth access token for `${MCP_URL}/mcp`, issued to a first-party client for the user behind
 * the session cookie: authorization code + PKCE run in-process through Better Auth (no browser
 * round-trip, no custom signing). The token carries `bibi_org` = the session's active org and
 * `azp` = the client; whether it may act as the AI actor is the client's `allowsAiActor` flag.
 *
 * Trust boundary: whoever holds the session cookie can already do everything the token allows.
 */
export const getFirstPartyAccessToken: GetFirstPartyAccessToken = async ({
  client,
  headers,
  caller,
}) => {
  const key = tokenCacheKey({ client, ...caller });
  const cached = readCachedToken({ key });
  if (cached) return ok({ value: cached });
  const resolved = resolveClient({ client });
  if (!resolved.ok) return resolved;
  const { verifier, challenge } = createPkcePair();
  const code = await authorizeCode({ headers, client: resolved.value, challenge });
  if (!code.ok) return code;
  const token = await exchangeCode({ code: code.value, verifier, client: resolved.value });
  if (!token.ok) return token;
  storeToken({ key, token: token.value });
  return ok({ value: token.value.accessToken });
};
