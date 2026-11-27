import { z } from "zod";
import { PROVIDER_KEYS } from "../../providers/provider-keys";

/** What a mapping is for (ADR 0123). `ENTITY_TYPE` names an item type. */
export const ACCOUNT_PURPOSES = ["ADVANCES", "REVENUE_DEFAULT", "ENTITY_TYPE"] as const;
export const AccountPurposeSchema = z
  .enum(ACCOUNT_PURPOSES)
  .describe(
    "ADVANCES: customer advances, where deposits are booked until invoiced. REVENUE_DEFAULT: " +
      "revenue for an item type with no mapping of its own. ENTITY_TYPE: revenue for one item type.",
  );

export const AccountMappingSchema = z.object({
  purpose: AccountPurposeSchema,
  entityTypeId: z.string().min(1).nullable().describe("The item type for ENTITY_TYPE; else null"),
  providerAccount: z
    .string()
    .min(1)
    .max(200)
    .describe(
      "The accounting system's own reference: Fortnox an account number, Spiris a coding family " +
        "such as Tjänster (see integration.list accounts); opaque to Bibi.",
    ),
});

export const AccountMappingListInputSchema = z.object({});

export const AccountMappingListSchema = z.object({
  provider: z
    .enum(PROVIDER_KEYS)
    .nullable()
    .describe("The connected accounting system the mappings belong to; null when none"),
  mappings: z.array(AccountMappingSchema),
});

export const AccountMappingSetInputSchema = z
  .object({
    purpose: AccountPurposeSchema,
    entityTypeId: z.string().min(1).nullable().default(null),
    providerAccount: AccountMappingSchema.shape.providerAccount
      .nullable()
      .describe("The account to book the purpose to; null removes the mapping"),
  })
  .refine((input) => (input.purpose === "ENTITY_TYPE") === (input.entityTypeId !== null), {
    message: "Set entityTypeId exactly for the ENTITY_TYPE purpose",
    path: ["entityTypeId"],
  });

export type AccountPurpose = z.infer<typeof AccountPurposeSchema>;
export type AccountMappingDto = z.infer<typeof AccountMappingSchema>;
export type AccountMappingListDto = z.infer<typeof AccountMappingListSchema>;
export type AccountMappingSetInput = z.infer<typeof AccountMappingSetInputSchema>;
