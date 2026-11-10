import { z } from "zod";
import { PAYMENT_METHODS, PROVIDER_KEYS } from "../../providers/provider-keys";

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

export const ConnectKindSchema = z
  .enum(["OAUTH", "HOSTED_ONBOARDING", "CREDENTIALS"])
  .describe(
    "How the provider connects: OAUTH (approve at the provider, integration.connect returns " +
      "authorizeUrl), HOSTED_ONBOARDING (the payout account, paymentAccount.startOnboarding) or " +
      "CREDENTIALS (integration.connect with `credentials`, see credentialFields).",
  );

/** One credential an admin enters for a CREDENTIALS provider (ADR 0100). */
export const CredentialFieldSchema = z.object({
  key: z.string().describe("The key in integration.connect `credentials`"),
  kind: z
    .enum(["TEXT", "SECRET", "FILE"])
    .describe("TEXT, SECRET (never shown again) or FILE (the file's content as base64)"),
  description: z.string().nullable(),
});

/** What the provider can do for the organization once connected (ADR 0100). */
export const IntegrationCapabilitiesSchema = z.object({
  methods: z
    .array(z.enum(PAYMENT_METHODS))
    .describe("The payment methods it can take (CARD, SWISH, INVOICE); routes pick among these"),
  invoicing: z.boolean().describe("It raises invoices (an INVOICE route can point to it)"),
  ledger: z.boolean().describe("It keeps the books for what it invoices; the SIE export skips it"),
});

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
  connectKind: ConnectKindSchema,
  credentialFields: z
    .array(CredentialFieldSchema)
    .describe("What integration.connect takes in `credentials`; [] unless CREDENTIALS"),
  capabilities: IntegrationCapabilitiesSchema,
  companyName: z.string().nullable().describe("The provider's company name, captured at connect."),
  organizationNumber: z.string().nullable(),
  connectedAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const IntegrationListInputSchema = z.object({});

export const IntegrationListOutputSchema = z.object({
  items: z.array(IntegrationConnectionSchema),
});

export const IntegrationConnectInputSchema = z.object({
  provider: IntegrationProviderSchema,
  credentials: z
    .record(z.string(), z.string().max(200_000))
    .optional()
    .describe(
      "For a CREDENTIALS provider only: its credentialFields by key (a FILE as base64). Checked " +
        "with the provider before they are stored sealed; never returned.",
    ),
});

export const IntegrationConnectOutputSchema = IntegrationConnectionSchema.extend({
  authorizeUrl: z
    .url()
    .nullable()
    .describe(
      "OAUTH: the provider's consent page. Open it in a browser signed in to Bibi; it is valid " +
        "for 10 minutes. Some providers require their system administrator to approve. Null " +
        "for CREDENTIALS, which are connected at once.",
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
export type IntegrationConnectKind = z.infer<typeof ConnectKindSchema>;
export type CredentialField = z.infer<typeof CredentialFieldSchema>;
export type IntegrationCapabilities = z.infer<typeof IntegrationCapabilitiesSchema>;
export type IntegrationConnectionDto = z.infer<typeof IntegrationConnectionSchema>;
export type IntegrationConnectInput = z.infer<typeof IntegrationConnectInputSchema>;
export type IntegrationConnectOutput = z.infer<typeof IntegrationConnectOutputSchema>;
export type IntegrationDisconnectInput = z.infer<typeof IntegrationDisconnectInputSchema>;
export type IntegrationCompleteConnectInput = z.infer<typeof IntegrationCompleteConnectInputSchema>;
export type IntegrationRefreshExpiringOutput = z.infer<
  typeof IntegrationRefreshExpiringOutputSchema
>;
