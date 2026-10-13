import { getEnv } from "@okazi/config";

/** Mount path of the Better Auth handler in the web app (`app/api/auth/[...all]/route.ts`). */
export const AUTH_BASE_PATH = "/api/auth";

/** Path of the MCP endpoint on `MCP_URL`; OAuth tokens for MCP are audience-bound to it. */
export const MCP_PATH = "/mcp";

/** Canonical MCP protected-resource identifier (RFC 8707/9728), e.g. `http://localhost:3001/mcp`. */
export function mcpResourceUrl(): string {
  return new URL(MCP_PATH, getEnv().MCP_URL).toString();
}

export type WebUrlInput = { path: string };

/** Absolute URL in the web app, e.g. links in mails. */
export function webUrl({ path }: WebUrlInput): string {
  return new URL(path, getEnv().WEB_URL).toString();
}
