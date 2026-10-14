import { apiKey } from "@better-auth/api-key";
import { statementsForRole } from "../permissions";

/** Prefix of every Okazi API key; `Authorization: Bearer okz_…` is routed to key auth. */
export const API_KEY_PREFIX = "okz_";

/**
 * REST API keys (ADR 0005). Keys are owned by a user and bound to one organization via
 * `metadata.organizationId`; the owner's membership is re-checked on every request.
 * Permissions can only be set server-side (`createOrgApiKey`); default is read-only.
 */
export function apiKeyPlugin() {
  return apiKey({
    defaultPrefix: API_KEY_PREFIX,
    enableMetadata: true,
    requireName: true,
    references: "user",
    rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 600 },
    permissions: { defaultPermissions: statementsForRole({ role: "viewer" }) },
  });
}
