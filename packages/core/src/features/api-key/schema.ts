import { z } from "zod";
import { FixedRoleSchema } from "../../permissions/fixed-roles";
import { PageInputShape } from "../../shared/page-input";

/** Prefix of every Okazi API key; `Authorization: Bearer okz_…` is routed to key auth. */
export const API_KEY_PREFIX = "okz_";

/** Per-key rate limit, shared by core (issuing) and the Better Auth plugin (verifying). */
export const API_KEY_RATE_LIMIT = { timeWindow: 60_000, maxRequests: 600 } as const;

/**
 * An organization's API key for REST (ADR 0005, 0050). It belongs to the organization, not to a
 * user, and keeps working when its creator leaves. Never carries the secret or its hash.
 */
export const ApiKeySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  /** First characters of the key (e.g. `okz_Ab`), to tell keys apart. */
  start: z.string().nullable(),
  /** The preset the key acts with (ADR 0050), fine-tuned with `permission.update`; empty for a key without a valid preset. */
  role: z.string(),
  /** The admin who created the key (user id), for the record only. */
  createdBy: z.string(),
  /** Their name, or `null` when they are no longer a member. */
  createdByName: z.string().nullable(),
  createdAt: z.date(),
  expiresAt: z.date().nullable(),
  lastUsedAt: z.date().nullable(),
});

/** `apiKey.create` output: the key plus its secret, which is shown this one time only. */
export const ApiKeyCreatedSchema = z.object({
  apiKey: ApiKeySchema,
  secret: z.string().describe("The full key. Shown once; it cannot be read again."),
});

export const ApiKeyCreateInputSchema = z.object({
  name: z.string().trim().min(1).max(32).describe("What the key is for, e.g. CRM sync"),
  role: FixedRoleSchema.describe(
    "The preset: member, manager or admin; fine-tune with permission.update",
  ),
  expiresInDays: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe("Days until the key expires; omit for a key that does not expire"),
});

export const ApiKeyIdInputSchema = z.object({ id: z.string().min(1).describe("API key id") });

export const ApiKeyUpdateInputSchema = ApiKeyIdInputSchema.extend({
  name: z.string().trim().min(1).max(32).optional().describe("New name"),
  role: FixedRoleSchema.optional().describe("New preset: member, manager or admin"),
});

export const ApiKeyListInputSchema = z.object(PageInputShape);

export const ApiKeyListOutputSchema = z.object({
  items: z.array(ApiKeySchema),
  nextCursor: z.string().nullable(),
});

export type ApiKeyDto = z.infer<typeof ApiKeySchema>;
export type ApiKeyCreated = z.infer<typeof ApiKeyCreatedSchema>;
export type ApiKeyCreateInput = z.input<typeof ApiKeyCreateInputSchema>;
export type ApiKeyUpdateInput = z.input<typeof ApiKeyUpdateInputSchema>;
