import type { JsonObject } from "../http/json-schema";

/** Describe-only: authentication itself is resolved by the injected `resolveContext`. */
export const SECURITY_SCHEMES: JsonObject = {
  apiKey: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "bib_<key>",
    description: "Organization API key: `Authorization: Bearer bib_…`.",
  },
  session: {
    type: "apiKey",
    in: "cookie",
    name: "better-auth.session_token",
    description: "Browser session cookie from the web app.",
  },
  oauth2: {
    type: "oauth2",
    description: "OAuth 2.1 access token (used by MCP clients and third-party apps).",
    flows: {
      authorizationCode: {
        authorizationUrl: "/api/auth/oauth2/authorize",
        tokenUrl: "/api/auth/oauth2/token",
        scopes: { "bibi:read": "Read data", "bibi:write": "Change data" },
      },
    },
  },
};

export const SECURITY_REQUIREMENTS: JsonObject[] = [
  { apiKey: [] },
  { session: [] },
  { oauth2: ["bibi:read", "bibi:write"] },
];
