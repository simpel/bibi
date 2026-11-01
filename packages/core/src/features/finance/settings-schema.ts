import { z } from "zod";

/** A BAS account number: four digits (ADR 0077). */
export const AccountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, { message: "An account is four digits" })
  .describe("Account number in the chart of accounts, four digits (BAS), e.g. 3001");

/** The fixed accounts; every one has a BAS default, so nothing is required to export. */
const ACCOUNT_KEYS = [
  "receivableAccount",
  "clearingAccount",
  "advancesAccount",
  "feesAccount",
  "roundingAccount",
  "revenueAccount",
  "vat25Account",
  "vat12Account",
  "vat6Account",
] as const;

export type AccountKey = (typeof ACCOUNT_KEYS)[number];

/** The BAS defaults a new organization starts from (ADR 0077). */
export const DEFAULT_ACCOUNTS: Readonly<Record<AccountKey, string>> = {
  receivableAccount: "1510",
  clearingAccount: "1580",
  advancesAccount: "2420",
  feesAccount: "6570",
  roundingAccount: "3740",
  revenueAccount: "3001",
  vat25Account: "2611",
  vat12Account: "2621",
  vat6Account: "2631",
};

const account = AccountNumberSchema;

/** The fixed accounts as a Zod shape (explicit keys, so adapters see a plain object). */
const accountShape = {
  receivableAccount: account.describe("Customer receivables (BAS 1510)"),
  clearingAccount: account.describe("Payments on their way from the payment provider (BAS 1580)"),
  advancesAccount: account.describe("Customer advances: paid deposits until invoiced (BAS 2420)"),
  feesAccount: account.describe("The payment provider's fees (BAS 6570)"),
  roundingAccount: account.describe("Rounding differences up to one krona (BAS 3740)"),
  revenueAccount: account.describe("Revenue when the item and its type name none (BAS 3001)"),
  vat25Account: account.describe("Output VAT 25 % (BAS 2611)"),
  vat12Account: account.describe("Output VAT 12 % (BAS 2621)"),
  vat6Account: account.describe("Output VAT 6 % (BAS 2631)"),
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
  fiscalYearStartMonth: z.number().int().min(1).max(12).describe("First month of the fiscal year"),
  revenueAccounts: z
    .array(RevenueAccountSchema)
    .describe("Revenue accounts per item type or item; others use revenueAccount"),
});

export const AccountingSettingsGetInputSchema = z.object({});

export const AccountingSettingsUpdateInputSchema = z
  .object(accountShape)
  .partial()
  .extend({
    fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
    revenueAccounts: z
      .array(RevenueAccountInputSchema)
      .max(500)
      .optional()
      .describe("Replaces every revenue account mapping; omit to keep them"),
  });

export type RevenueAccountDto = z.infer<typeof RevenueAccountSchema>;
export type AccountingSettingsDto = z.infer<typeof AccountingSettingsSchema>;
export type AccountingSettingsUpdateInput = z.infer<typeof AccountingSettingsUpdateInputSchema>;
