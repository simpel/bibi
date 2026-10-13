import { getAuth } from "../get-auth";
import { mcpResourceUrl } from "../urls";
import { AppError, err, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { assistantRedirectUri, authEndpoint } from "./assistant-oauth";

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
});

export type AccessToken = { accessToken: string; expiresAt: number };

export type ExchangeCodeInput = { code: string; verifier: string; clientId: string };

/** Token request (`authorization_code` + PKCE, public client) through Better Auth's handler. */
export async function exchangeCode({
  code,
  verifier,
  clientId,
}: ExchangeCodeInput): Promise<Result<AccessToken>> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: assistantRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
    resource: mcpResourceUrl(),
  });
  const request = new Request(authEndpoint({ path: "/oauth2/token" }), { method: "POST", body });
  const response = await getAuth().handler(request);
  const parsed = TokenResponseSchema.safeParse(await response.json().catch(() => null));
  if (!response.ok || !parsed.success) {
    const message = "Token request for the assistant failed";
    return err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });
  }
  const expiresAt = Date.now() + parsed.data.expires_in * 1000;
  return ok({ value: { accessToken: parsed.data.access_token, expiresAt } });
}
