import { handleAuthRequest } from "@bibi/auth";

// RFC 9728 protected-resource metadata published by Better Auth's MCP plugin.
export const GET = (request: Request) => handleAuthRequest(request);
