import { AppError, err, ok, type Result } from "@bibi/core";
import { getLogger } from "@bibi/logger";
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

const ErrorBodySchema = z.object({ error: z.string().min(1) });

/** What the authorize endpoint answered: where it redirects, or the OAuth error it gave. */
type AuthorizeOutcome = { target: string | null; error: string | null };

const signInRequired = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "UNAUTHENTICATED", message }) });

const redirectInBody = ({ body }: { body: unknown }): string | null => {
  const parsed = RedirectBodySchema.safeParse(body);
  if (!parsed.success) return null;
  return "url" in parsed.data ? parsed.data.url : parsed.data.redirect;
};

const readOutcome = async ({ response }: { response: Response }): Promise<AuthorizeOutcome> => {
  const location = response.headers.get("location");
  const body: unknown = location ? null : await response.json().catch(() => null);
  const target = location ?? redirectInBody({ body });
  const queryError = target ? new URL(target, "http://localhost").searchParams.get("error") : null;
  const bodyError = ErrorBodySchema.safeParse(body);
  return { target, error: queryError ?? (bodyError.success ? bodyError.data.error : null) };
};

/**
 * The provider refused the client itself (redirect URI not registered, resource not linked):
 * a server misconfiguration, not the user's session, so it is INTERNAL and logged.
 */
const clientRefused = ({ error, client }: { error: string; client: ResolvedClient }) => {
  getLogger().error({
    event: "auth.firstPartyAuthorizeFailed",
    oauthError: error,
    clientId: client.clientId,
    redirectUri: client.redirectUri,
    resource: mcpResourceUrl(),
  });
  const message = `The first-party OAuth client was refused (${error}); check its provisioning`;
  return err({ error: new AppError({ code: "INTERNAL", message }) });
};

/**
 * Authorization request (code + PKCE) run in-process through Better Auth's handler with the
 * user's session cookie. The first-party client skips consent, so the redirect carries the code
 * bound to the session's active organization (claim `bibi_org`).
 */
export async function authorizeCode({
  headers,
  client,
  challenge,
}: AuthorizeCodeInput): Promise<Result<string>> {
  const cookie = headers.get("cookie");
  if (!cookie) return signInRequired({ message: "Sign in required" });
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
  const { target, error } = await readOutcome({ response });
  const parsed = target ? new URL(target, redirectUri) : null;
  const code = parsed?.searchParams.get("code");
  if (parsed && code && parsed.toString().startsWith(redirectUri)) return ok({ value: code });
  if (error) return clientRefused({ error, client });
  return signInRequired({ message: "Could not authorize the first-party client for this session" });
}
