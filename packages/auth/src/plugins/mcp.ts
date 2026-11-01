import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import type { Db } from "@bibi/db";
import { jwt } from "better-auth/plugins";
import { memberOrganization } from "../member-organization";
import { mcpResourceUrl } from "../urls";

/** Scopes MCP clients may request (Better Auth defaults). */
export const OAUTH_SCOPES = ["openid", "profile", "email", "offline_access"];

/** Claim carrying the organization the token was granted for (active org at consent). */
export const ORG_CLAIM = "bibi_org";

type ActiveInput = { db: Db; user: { id: string }; session: Record<string, unknown> };

/** The session's active organization, only while the user is still a member of it. */
const activeOrganizationOf = ({ db, user, session }: ActiveInput) =>
  memberOrganization({ db, userId: user.id, organizationId: session.activeOrganizationId });

export type McpPluginsInput = { db: Db };

/**
 * OAuth 2.1 authorization server for MCP clients and the web assistant (ADR 0005).
 * Tokens are JWTs audience-bound to the MCP resource and carry `ORG_CLAIM`.
 */
export function mcpPlugins({ db }: McpPluginsInput) {
  return [
    jwt(),
    mcp({
      resource: mcpResourceUrl(),
      // Explicit allowedScopes: Prisma list columns cannot store the plugin's `null` default.
      resources: [{ identifier: mcpResourceUrl(), name: "Bibi MCP", allowedScopes: OAUTH_SCOPES }],
      scopes: OAUTH_SCOPES,
      loginPage: "/login",
      consentPage: "/oauth/consent",
      // No client_credentials: every token must represent a user (ADR 0005).
      grantTypes: ["authorization_code", "refresh_token"],
      // Stateless JWTs: keep them short so revocation (membership/refresh token) bites quickly.
      accessTokenExpiresIn: 15 * 60,
      postLogin: {
        page: "/welcome",
        // No organization the user belongs to: pick one on /welcome first.
        shouldRedirect: async ({ user, session }) =>
          (await activeOrganizationOf({ db, user, session })) === undefined,
        consentReferenceId: ({ user, session }) => activeOrganizationOf({ db, user, session }),
      },
      customAccessTokenClaims: ({ referenceId }) =>
        referenceId ? { [ORG_CLAIM]: referenceId } : {},
      clientPrivileges: ({ action }) => action === "read" || action === "list",
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ];
}
