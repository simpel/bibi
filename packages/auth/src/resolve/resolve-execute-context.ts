import { createExecuteContext, type ExecuteContext, ok, type Result } from "@okazi/core";
import { buildActor } from "./ai-actor";
import { forbidden } from "./errors";
import { principalFromAccessToken } from "./from-access-token";
import { principalFromApiKey } from "./from-api-key";
import { principalFromSession } from "./from-session";
import { logResolution } from "./log-resolution";
import type { Principal } from "./principal";
import { type Credential, readCredential } from "./read-credential";

export type ResolveExecuteContextInput = { headers: Headers };

type ResolveInput = ResolveExecuteContextInput & { credential: Credential };

const resolvePrincipal = ({ headers, credential }: ResolveInput): Promise<Result<Principal>> => {
  if (credential.kind === "apiKey") return principalFromApiKey({ key: credential.key });
  if (credential.kind === "accessToken")
    return principalFromAccessToken({ token: credential.token });
  return principalFromSession({ headers });
};

async function resolve({ headers, credential }: ResolveInput): Promise<Result<ExecuteContext>> {
  const principal = await resolvePrincipal({ headers, credential });
  if (!principal.ok) return principal;
  const { userId, apiKeyId, organizationId, roles, permissions, aiAllowed } = principal.value;
  if (roles === null) return forbidden({ message: "Not a member of the organization" });
  const actor = buildActor({ headers, userId, apiKeyId, aiAllowed });
  if (!actor.ok) return actor;
  return ok({
    value: createExecuteContext({
      organizationId,
      actor: actor.value,
      roles,
      permissions,
      credential: credential.kind,
    }),
  });
}

/**
 * THE caller resolution for every surface (web, GraphQL, REST, MCP). Accepts a session cookie,
 * an API key (`x-api-key` or `Authorization: Bearer okz_…`) or an MCP OAuth access token
 * (`Authorization: Bearer <jwt>`). Fails with UNAUTHENTICATED (no/invalid credential) or
 * FORBIDDEN (no organization, not a member, untrusted AI actor request). Logs the outcome and
 * puts the caller on the request's log context (ADR 0014).
 */
export async function resolveExecuteContext({
  headers,
}: ResolveExecuteContextInput): Promise<Result<ExecuteContext>> {
  const credential = readCredential({ headers });
  const resolved = await resolve({ headers, credential });
  logResolution({ credential: credential.kind, resolved });
  return resolved;
}
