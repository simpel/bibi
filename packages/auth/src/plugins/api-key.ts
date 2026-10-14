import { apiKey } from "@better-auth/api-key";

/** Prefix of every Okazi API key; `Authorization: Bearer okz_…` is routed to key auth. */
export const API_KEY_PREFIX = "okz_";

/**
 * REST API keys (ADR 0005). Keys are owned by a user and bound to one organization via
 * `metadata.organizationId`; the owner's membership is re-checked on every request.
 * Access comes from the role in `metadata.role`, set server-side by `createOrgApiKey` (ADR 0020).
 */
export function apiKeyPlugin() {
  return apiKey({
    defaultPrefix: API_KEY_PREFIX,
    enableMetadata: true,
    requireName: true,
    references: "user",
    rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 600 },
  });
}
