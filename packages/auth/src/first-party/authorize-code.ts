import { AppError, err, ok, type Result } from "@okazi/core";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";
import { getAuth } from "../get-auth";
import { mcpResourceUrl } from "../urls";
import { authEndpoint, type ResolvedClient } from "./endpoints";

export type AuthorizeCodeInput = {
  /** Incoming request headers; only `cookie` (the user's session) is forwarded. */
  headers: Headers;
  client: ResolvedClient;
  challenge: string;
};

const RedirectBodySchema = z
  .object({ url: z.string().min(1) })
  .or(z.object({ redirect: z.string() }));

const failed = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });

const redirectTarget = async ({ response }: { response: Response }): Promise<string | null> => {
  const location = response.headers.get("location");
  if (location) return location;
  const body = RedirectBodySchema.safeParse(await response.json().catch(() => null));
  if (!body.success) return null;
  return "url" in body.data ? body.data.url : body.data.redirect;
};

/**
 * Authorization request (code + PKCE) run in-process through Better Auth's handler with the
 * user's session cookie. The first-party client skips consent, so the redirect carries the code
 * bound to the session's active organization (claim `okazi_org`).
 */
export async function authorizeCode({
  headers,
  client,
  challenge,
}: AuthorizeCodeInput): Promise<Result<string>> {
  const cookie = headers.get("cookie");
  if (!cookie) return failed({ message: "Sign in required" });
  const { clientId, redirectUri, scope } = client;
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: createId(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: mcpResourceUrl(),
  });
  const url = authEndpoint({ path: `/oauth2/authorize?${query}` });
  const response = await getAuth().handler(new Request(url, { headers: { cookie } }));
  const target = await redirectTarget({ response });
  const parsed = target ? new URL(target, redirectUri) : null;
  const code = parsed?.searchParams.get("code");
  if (!parsed || !code || !parsed.toString().startsWith(redirectUri)) {
    return failed({ message: "Could not authorize the first-party client for this session" });
  }
  return ok({ value: code });
}
