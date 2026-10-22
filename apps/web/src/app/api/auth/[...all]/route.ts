import { authHandler } from "@bibi/auth";

// Better Auth: sessions, organizations, API keys, magic link/OTP, OAuth provider for MCP.
export const { GET, POST } = authHandler;
