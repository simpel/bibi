import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";

export const IntegrationProviderSchema = z
  .enum(PROVIDER_KEYS)
  .describe(
    "The outside system. integration.list names the ones connected here by OAuth (e.g. FORTNOX, " +
      "accounting and invoicing).",
  );

export const IntegrationStatusSchema = z
  .enum(["NOT_CONNECTED", "PENDING", "CONNECTED", "EXPIRED", "DISCONNECTED"])
  .describe(
    "NOT_CONNECTED: never started. PENDING: waiting for approval at the provider. CONNECTED: " +
      "ready. EXPIRED: the provider refused the stored grant, reconnect. DISCONNECTED: an admin " +
      "disconnected.",
  );

/** One provider's connection for the organization (ADR 0087). Tokens never appear here. */
export const IntegrationConnectionSchema = z.object({
  id: z.string().nullable().describe("Null while NOT_CONNECTED (no row yet)."),
  organizationId: z.string(),
  provider: IntegrationProviderSchema,
  status: IntegrationStatusSchema,
  configured: z
    .boolean()
    .describe(
      "False when Bibi has no app credentials for the provider: connecting is unavailable.",
    ),
  companyName: z.string().nullable().describe("The provider's company name, captured at connect."),
  organizationNumber: z.string().nullable(),
  connectedAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const IntegrationListInputSchema = z.object({});

export const IntegrationListOutputSchema = z.object({
  items: z.array(IntegrationConnectionSchema),
});

export const IntegrationConnectInputSchema = z.object({ provider: IntegrationProviderSchema });

export const IntegrationConnectOutputSchema = IntegrationConnectionSchema.extend({
  authorizeUrl: z
    .url()
    .describe(
      "The provider's consent page. Open it in a browser signed in to Bibi; it is valid for 10 " +
        "minutes. Some providers (Fortnox) require their system administrator to approve.",
    ),
});

export const IntegrationDisconnectInputSchema = z.object({ provider: IntegrationProviderSchema });

export const IntegrationCompleteConnectInputSchema = z.object({
  provider: IntegrationProviderSchema,
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(512),
});

export const IntegrationRefreshExpiringInputSchema = z.object({});

export const IntegrationRefreshExpiringOutputSchema = z.object({
  due: z.number().int().describe("Connections whose refresh token expires soon."),
  refreshed: z.number().int(),
  expired: z.number().int().describe("Connections the provider refused: now EXPIRED."),
});

export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;
export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;
export type IntegrationConnectionDto = z.infer<typeof IntegrationConnectionSchema>;
export type IntegrationConnectInput = z.infer<typeof IntegrationConnectInputSchema>;
export type IntegrationConnectOutput = z.infer<typeof IntegrationConnectOutputSchema>;
export type IntegrationDisconnectInput = z.infer<typeof IntegrationDisconnectInputSchema>;
export type IntegrationCompleteConnectInput = z.infer<typeof IntegrationCompleteConnectInputSchema>;
export type IntegrationRefreshExpiringOutput = z.infer<
  typeof IntegrationRefreshExpiringOutputSchema
>;
