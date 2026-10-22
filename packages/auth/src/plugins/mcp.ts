import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { jwt } from "better-auth/plugins";
import { mcpResourceUrl } from "../urls";

/** Scopes MCP clients may request (Better Auth defaults). */
export const OAUTH_SCOPES = ["openid", "profile", "email", "offline_access"];

/** Claim carrying the organization the token was granted for (active org at consent). */
export const ORG_CLAIM = "bibi_org";

const activeOrganizationOf = ({ session }: { session: Record<string, unknown> }) => {
  const id = session.activeOrganizationId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
};

/**
 * OAuth 2.1 authorization server for MCP clients and the web assistant (ADR 0005).
 * Tokens are JWTs audience-bound to the MCP resource and carry `ORG_CLAIM`.
 */
export function mcpPlugins() {
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
        page: "/select-organization",
        shouldRedirect: ({ session }) => activeOrganizationOf({ session }) === undefined,
        consentReferenceId: ({ session }) => activeOrganizationOf({ session }),
      },
      customAccessTokenClaims: ({ referenceId }) =>
        referenceId ? { [ORG_CLAIM]: referenceId } : {},
      clientPrivileges: ({ action }) => action === "read" || action === "list",
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ];
}
