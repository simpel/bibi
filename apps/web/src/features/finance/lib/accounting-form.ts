import type {
  AccountingSettingsDto,
  AccountingSettingsUpdateInput,
  RevenueAccountDto,
} from "@bibi/core/schemas";

/** The fixed accounts rows raised in the accounting system post to (ADR 0106). */
export const ACCOUNT_KEYS = ["advancesAccount", "revenueAccount"] as const;

export type AccountKey = (typeof ACCOUNT_KEYS)[number];

export type TypeAccount = { entityTypeId: string; account: string };

/** Raw form values: every input is a string; an empty type account uses the default revenue account. */
export type AccountingFormValues = Record<AccountKey, string> & {
  typeAccounts: TypeAccount[];
};

export type ItemTypeOption = { id: string; name: string };

export type ToFormValuesInput = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

export function toFormValues({ settings, types }: ToFormValuesInput): AccountingFormValues {
  const typeAccounts = types.map(({ id }) => ({
    entityTypeId: id,
    account: settings.revenueAccounts.find((row) => row.entityTypeId === id)?.account ?? "",
  }));
  return {
    advancesAccount: settings.advancesAccount,
    revenueAccount: settings.revenueAccount,
    typeAccounts,
  };
}

export type KeptRowsInput = { settings: AccountingSettingsDto; types: ItemTypeOption[] };

/** Rows the form has no input for (item-level, or a type that is not listed) stay as they are. */
export function keptRevenueRows({ settings, types }: KeptRowsInput): RevenueAccountDto[] {
  const listed = new Set(types.map(({ id }) => id));
  return settings.revenueAccounts.filter(
    (row) => row.itemId !== null || row.entityTypeId === null || !listed.has(row.entityTypeId),
  );
}

export type ToUpdateInput = { values: AccountingFormValues; kept: RevenueAccountDto[] };

/** The full update: every account and the complete revenue mapping set. */
export function toUpdateInput({ values, kept }: ToUpdateInput): AccountingSettingsUpdateInput {
  const { typeAccounts, ...accounts } = values;
  const rows = typeAccounts
    .filter(({ account }) => account.trim() !== "")
    .map(({ entityTypeId, account }) => ({ entityTypeId, itemId: null, account }));
  return {
    ...accounts,
    revenueAccounts: [...kept, ...rows],
  };
}
