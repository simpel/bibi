import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { jwt } from "better-auth/plugins";
import { mcpResourceUrl } from "../urls";

/** Claim carrying the organization the token was granted for (active org at consent). */
export const ORG_CLAIM = "okazi_org";

type SessionWithOrg = { activeOrganizationId?: unknown };

const activeOrganizationOf = ({ session }: { session: SessionWithOrg }): string | undefined =>
  typeof session.activeOrganizationId === "string" ? session.activeOrganizationId : undefined;

/**
 * OAuth 2.1 authorization server for MCP clients and the web assistant (ADR 0005).
 * Tokens are JWTs audience-bound to the MCP resource and carry `ORG_CLAIM`.
 */
export function mcpPlugins() {
  return [
    jwt(),
    mcp({
      resource: mcpResourceUrl(),
      loginPage: "/login",
      consentPage: "/oauth/consent",
      postLogin: {
        page: "/select-organization",
        shouldRedirect: ({ session }) => activeOrganizationOf({ session }) === undefined,
        consentReferenceId: ({ session }) => activeOrganizationOf({ session }),
      },
      customAccessTokenClaims: ({ referenceId }) => (referenceId ? { [ORG_CLAIM]: referenceId } : {}),
      clientPrivileges: ({ action }) => action === "read" || action === "list",
    }),
    cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
  ];
}
