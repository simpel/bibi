export const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";
export const MCP_ENDPOINT_PATH = "/mcp";

export type ResourceMetadataInput = { resource: string; authorizationServer: string };

/** RFC 9728 protected-resource metadata: tells clients which authorization server to use. */
export function protectedResourceMetadata({
  resource,
  authorizationServer,
}: ResourceMetadataInput) {
  return {
    resource,
    authorization_servers: [authorizationServer],
    bearer_methods_supported: ["header"],
    resource_name: "Bibi MCP",
  };
}

export type ChallengeInput = { metadataUrl: string };

/** `WWW-Authenticate` for a missing/invalid credential (RFC 9728 section 5.1). */
export function wwwAuthenticate({ metadataUrl }: ChallengeInput): string {
  return `Bearer resource_metadata="${metadataUrl}"`;
}
