import { verifyJwsAccessToken } from "@better-auth/core/oauth2";
import { ok, type Result } from "@okazi/core";
import { z } from "zod";
import { clientAllowsAiActor } from "../first-party/clients";
import { getAuth } from "../get-auth";
import { ORG_CLAIM } from "../plugins/mcp";
import { mcpResourceUrl } from "../urls";
import { forbidden, unauthenticated } from "./errors";
import { loadMembership } from "./membership";
import type { Principal } from "./principal";

const ClaimsSchema = z.object({
  sub: z.string().min(1),
  azp: z.string().min(1),
  [ORG_CLAIM]: z.string().min(1).optional(),
  cnf: z.unknown().optional(),
});

const jwksCacheKey = {};

const verify = async ({ token }: { token: string }): Promise<unknown> => {
  const auth = getAuth();
  const { baseURL } = await auth.$context;
  return verifyJwsAccessToken(token, {
    jwksFetch: () => auth.api.getJwks(),
    jwksCacheKey,
    verifyOptions: { issuer: baseURL, audience: mcpResourceUrl() },
  }).catch(() => null);
};

export type FromAccessTokenInput = { token: string };

/** OAuth access token (JWT from the MCP plugin, audience = MCP resource) → user + granted org. */
export async function principalFromAccessToken({
  token,
}: FromAccessTokenInput): Promise<Result<Principal>> {
  const claims = ClaimsSchema.safeParse(await verify({ token }));
  if (!claims.success) return unauthenticated({ message: "Invalid or expired access token" });
  const { sub: userId, azp, cnf, [ORG_CLAIM]: organizationId } = claims.data;
  if (cnf !== undefined) return unauthenticated({ message: "DPoP-bound tokens are not supported" });
  if (!organizationId)
    return forbidden({ message: "Access token is not bound to an organization" });
  const membership = await loadMembership({ userId, organizationId });
  // Only registry clients flagged `allowsAiActor` (the assistant) may act as the AI actor.
  const aiAllowed = clientAllowsAiActor({ clientId: azp });
  const roles = membership?.roles ?? null;
  const permissions = membership?.permissions ?? {};
  return ok({ value: { userId, organizationId, roles, permissions, aiAllowed } });
}
