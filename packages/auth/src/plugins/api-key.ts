import { apiKey } from "@better-auth/api-key";
import { API_KEY_PREFIX, API_KEY_RATE_LIMIT } from "@okazi/core";

/**
 * Every HTTP endpoint the API key plugin adds. All are disabled: keys are issued, listed and
 * revoked only by core `apiKey.*` (authorized and audited there, ADR 0005). The plugin is used
 * server-side for `verifyApiKey` (server-only, no HTTP path) only.
 */
export const DISABLED_API_KEY_PATHS = [
  "/api-key/create",
  "/api-key/get",
  "/api-key/update",
  "/api-key/delete",
  "/api-key/list",
];

/**
 * REST API keys (ADR 0005). Keys belong to an organization (`organizationId`, Better Auth's
 * `referenceId`) and are owned by the user in `metadata.userId`, whose membership is re-checked
 * on every request. Access comes from the role in `metadata.role` (ADR 0020). Rows are written
 * by core `apiKey.create` with the same hashing and rate limit as this plugin.
 */
export function apiKeyPlugin() {
  return apiKey({
    defaultPrefix: API_KEY_PREFIX,
    enableMetadata: true,
    requireName: true,
    references: "organization",
    rateLimit: { enabled: true, ...API_KEY_RATE_LIMIT },
    schema: { apikey: { fields: { referenceId: "organizationId" } } },
  });
}
