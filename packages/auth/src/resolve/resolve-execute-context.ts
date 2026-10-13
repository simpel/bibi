import { createExecuteContext, type ExecuteContext, ok, type Result } from "@okazi/core";
import { buildActor } from "./ai-actor";
import { forbidden } from "./errors";
import { principalFromAccessToken } from "./from-access-token";
import { principalFromApiKey } from "./from-api-key";
import { principalFromSession } from "./from-session";
import type { Principal } from "./principal";
import { readCredential } from "./read-credential";

export type ResolveExecuteContextInput = { headers: Headers };

const resolvePrincipal = ({ headers }: ResolveExecuteContextInput): Promise<Result<Principal>> => {
  const credential = readCredential({ headers });
  if (credential.kind === "apiKey") return principalFromApiKey({ key: credential.key });
  if (credential.kind === "accessToken")
    return principalFromAccessToken({ token: credential.token });
  return principalFromSession({ headers });
};

/**
 * THE caller resolution for every surface (web, GraphQL, REST, MCP). Accepts a session cookie,
 * an API key (`x-api-key` or `Authorization: Bearer okz_…`) or an MCP OAuth access token
 * (`Authorization: Bearer <jwt>`). Fails with UNAUTHENTICATED (no/invalid credential) or
 * FORBIDDEN (no organization, not a member, untrusted AI actor request).
 */
export async function resolveExecuteContext({
  headers,
}: ResolveExecuteContextInput): Promise<Result<ExecuteContext>> {
  const principal = await resolvePrincipal({ headers });
  if (!principal.ok) return principal;
  const { userId, organizationId, roles, aiAllowed } = principal.value;
  if (roles.length === 0) return forbidden({ message: "Not a member of the organization" });
  const actor = buildActor({ headers, userId, aiAllowed });
  if (!actor.ok) return actor;
  return ok({ value: createExecuteContext({ organizationId, actor: actor.value, roles }) });
}
