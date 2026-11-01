import type {
  AccountingSettingsDto,
  AccountingSettingsUpdateInput,
  RevenueAccountDto,
} from "@bibi/core/schemas";

/** The fixed accounts, in the groups the form shows them. */
export const ACCOUNT_GROUPS = {
  accounts: [
    "receivableAccount",
    "clearingAccount",
    "advancesAccount",
    "feesAccount",
    "roundingAccount",
    "revenueAccount",
  ],
  vat: ["vat25Account", "vat12Account", "vat6Account"],
} as const;

export type AccountKey = (typeof ACCOUNT_GROUPS)[keyof typeof ACCOUNT_GROUPS][number];

export type TypeAccount = { entityTypeId: string; account: string };

/** Raw form values: every input is a string; an empty type account uses the default revenue account. */
export type AccountingFormValues = Record<AccountKey, string> & {
  fiscalYearStartMonth: string;
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
    receivableAccount: settings.receivableAccount,
    clearingAccount: settings.clearingAccount,
    advancesAccount: settings.advancesAccount,
    feesAccount: settings.feesAccount,
    roundingAccount: settings.roundingAccount,
    revenueAccount: settings.revenueAccount,
    vat25Account: settings.vat25Account,
    vat12Account: settings.vat12Account,
    vat6Account: settings.vat6Account,
    fiscalYearStartMonth: String(settings.fiscalYearStartMonth),
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

/** The full update: every account, the month and the complete revenue mapping set. */
export function toUpdateInput({ values, kept }: ToUpdateInput): AccountingSettingsUpdateInput {
  const { typeAccounts, fiscalYearStartMonth, ...accounts } = values;
  const rows = typeAccounts
    .filter(({ account }) => account.trim() !== "")
    .map(({ entityTypeId, account }) => ({ entityTypeId, itemId: null, account }));
  return {
    ...accounts,
    fiscalYearStartMonth: Number(fiscalYearStartMonth),
    revenueAccounts: [...kept, ...rows],
  };
}
