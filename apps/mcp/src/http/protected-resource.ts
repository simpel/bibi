export const PROTECTED_RESOURCE_PATH = "/.well-known/oauth-protected-resource";
export const MCP_ENDPOINT_PATH = "/mcp";

export type ChallengeInput = { metadataUrl: string };

/** `WWW-Authenticate` for a missing/invalid credential (RFC 9728 section 5.1). */
export function wwwAuthenticate({ metadataUrl }: ChallengeInput): string {
  return `Bearer resource_metadata="${metadataUrl}"`;
}
