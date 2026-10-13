import { getEnv } from "@okazi/config";
import { AppError, err, ok, type Result } from "@okazi/core";
import { AUTH_BASE_PATH } from "../urls";
import { FIRST_PARTY_CLIENTS, type FirstPartyClient } from "./clients";

export type AuthEndpointInput = { path: string };

/** Absolute Better Auth endpoint, e.g. `/oauth2/token` → `http://localhost:3000/api/auth/oauth2/token`. */
export function authEndpoint({ path }: AuthEndpointInput): string {
  return `${getEnv().BETTER_AUTH_URL}${AUTH_BASE_PATH}${path}`;
}

/** A registry client with its id and absolute redirect URI resolved from config. */
export type ResolvedClient = { clientId: string; redirectUri: string; scope: string };

export type ResolveClientInput = { client: FirstPartyClient };

export function resolveClient({ client }: ResolveClientInput): Result<ResolvedClient> {
  const config = FIRST_PARTY_CLIENTS[client];
  const clientId = config.clientId();
  if (!clientId)
    return err({ error: new AppError({ code: "INTERNAL", message: config.missingHint }) });
  const redirectUri = new URL(config.redirectPath, getEnv().WEB_URL).toString();
  return ok({ value: { clientId, redirectUri, scope: config.scope } });
}
