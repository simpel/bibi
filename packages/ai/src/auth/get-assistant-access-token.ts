import { ok, type Result } from "@okazi/core";
import { assistantClientId } from "./assistant-oauth";
import { authorizeCode } from "./authorize-code";
import { exchangeCode } from "./exchange-code";
import { createPkcePair } from "./pkce";
import { readCachedToken, storeToken, tokenCacheKey } from "./token-cache";

export type GetAssistantAccessTokenInput = {
  /** The user's request headers (session cookie). */
  headers: Headers;
  /** Verified caller from `resolveExecuteContext` (cache key; the token is for this user+org). */
  caller: { userId: string; organizationId: string };
};

/** Mints (or reuses) an MCP access token for the signed-in user, as the web app. */
export type GetAccessToken = (input: GetAssistantAccessTokenInput) => Promise<Result<string>>;

/**
 * OAuth access token for `${MCP_URL}/mcp` issued to the first-party client `WEB_OAUTH_CLIENT_ID`
 * for the user behind the session cookie: authorization code + PKCE run in-process through Better
 * Auth (no browser round-trip, no custom signing). The token carries `okazi_org` = the session's
 * active org and `azp` = the web client, which is what lets `x-okazi-actor: ai` through.
 *
 * Trust boundary: whoever holds the session cookie can already do everything the token allows;
 * the token only *adds* the AI-actor mode, which is more restricted (commands need approval).
 */
export const getAssistantAccessToken: GetAccessToken = async ({ headers, caller }) => {
  const key = tokenCacheKey(caller);
  const cached = readCachedToken({ key });
  if (cached) return ok({ value: cached });
  const clientId = assistantClientId();
  if (!clientId.ok) return clientId;
  const { verifier, challenge } = createPkcePair();
  const code = await authorizeCode({ headers, clientId: clientId.value, challenge });
  if (!code.ok) return code;
  const token = await exchangeCode({ code: code.value, verifier, clientId: clientId.value });
  if (!token.ok) return token;
  storeToken({ key, token: token.value });
  return ok({ value: token.value.accessToken });
};
