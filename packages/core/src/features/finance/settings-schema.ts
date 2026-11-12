import { z } from "zod";

/** A BAS account number: four digits (ADR 0077). */
export const AccountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, { message: "An account is four digits" })
  .describe("Account number in the chart of accounts, four digits (BAS), e.g. 3001");

/** The fixed accounts rows raised in the accounting system post to (ADR 0106); each has a BAS default. */
const ACCOUNT_KEYS = ["advancesAccount", "revenueAccount"] as const;

export type AccountKey = (typeof ACCOUNT_KEYS)[number];

/** The BAS defaults a new organization starts from (ADR 0077). */
export const DEFAULT_ACCOUNTS: Readonly<Record<AccountKey, string>> = {
  advancesAccount: "2420",
  revenueAccount: "3001",
};

const account = AccountNumberSchema;

/** The fixed accounts as a Zod shape (explicit keys, so adapters see a plain object). */
const accountShape = {
  advancesAccount: account.describe("Customer advances: deposits until invoiced (BAS 2420)"),
  revenueAccount: account.describe("Revenue when the item and its type name none (BAS 3001)"),
} satisfies Record<AccountKey, z.ZodType<string>>;

/** The revenue account of one item type or one item; exactly one of the two ids is set. */
export const RevenueAccountSchema = z.object({
  entityTypeId: z.string().min(1).nullable().describe("An item type (entityType.list base ITEM)"),
  itemId: z.string().min(1).nullable().describe("An item (item.list); wins over its type"),
  account: AccountNumberSchema,
});

const RevenueAccountInputSchema = RevenueAccountSchema.refine(
  (row) => (row.entityTypeId === null) !== (row.itemId === null),
  { message: "Set exactly one of entityTypeId and itemId" },
);

export const AccountingSettingsSchema = z.object({
  id: z.string().nullable().describe("null until saved; the BAS defaults apply until then"),
  ...accountShape,
  revenueAccounts: z
    .array(RevenueAccountSchema)
    .describe("Revenue accounts per item type or item; others use revenueAccount"),
});

export const AccountingSettingsGetInputSchema = z.object({});

export const AccountingSettingsUpdateInputSchema = z
  .object(accountShape)
  .partial()
  .extend({
    revenueAccounts: z
      .array(RevenueAccountInputSchema)
      .max(500)
      .optional()
      .describe("Replaces every revenue account mapping; omit to keep them"),
  });

export type RevenueAccountDto = z.infer<typeof RevenueAccountSchema>;
export type AccountingSettingsDto = z.infer<typeof AccountingSettingsSchema>;
export type AccountingSettingsUpdateInput = z.infer<typeof AccountingSettingsUpdateInputSchema>;
