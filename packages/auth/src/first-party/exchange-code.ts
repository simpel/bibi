import { AppError, err, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { mcpResourceUrl } from "../urls";
import { authEndpoint, type ResolvedClient } from "./endpoints";

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export type AccessToken = { accessToken: string; expiresAt: number };

export type ExchangeCodeInput = { code: string; verifier: string; client: ResolvedClient };

/** Token request (`authorization_code` + PKCE, public client) through Better Auth's handler. */
export async function exchangeCode({
  code,
  verifier,
  client,
}: ExchangeCodeInput): Promise<Result<AccessToken>> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: client.redirectUri,
    client_id: client.clientId,
    code_verifier: verifier,
    resource: mcpResourceUrl(),
  });
  const request = new Request(authEndpoint({ path: "/oauth2/token" }), { method: "POST", body });
  const response = await getAuth().handler(request);
  const parsed = TokenResponseSchema.safeParse(await response.json().catch(() => null));
  if (!response.ok || !parsed.success) {
    const message = "First-party token request failed";
    return err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });
  }
  const expiresAt = Date.now() + parsed.data.expires_in * 1000;
  return ok({ value: { accessToken: parsed.data.access_token, expiresAt } });
}
