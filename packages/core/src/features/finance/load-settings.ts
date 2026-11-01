import type { OperationContext } from "../../operations/types";
import { type AccountingSettingsDto, DEFAULT_ACCOUNTS } from "./settings-schema";

type Db = { context: Pick<OperationContext, "db"> };

const SETTINGS_SELECT = {
  id: true,
  receivableAccount: true,
  clearingAccount: true,
  advancesAccount: true,
  feesAccount: true,
  roundingAccount: true,
  revenueAccount: true,
  vat25Account: true,
  vat12Account: true,
  vat6Account: true,
  fiscalYearStartMonth: true,
} as const;

/** The organization's accounts, or the BAS defaults before the first save (ADR 0077). */
export async function loadAccountingSettings({ context }: Db): Promise<AccountingSettingsDto> {
  const [row, mappings] = await Promise.all([
    context.db.accountingSettings.findFirst({ select: SETTINGS_SELECT }),
    context.db.revenueAccount.findMany({
      select: { entityTypeId: true, itemId: true, account: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const fixed = row ?? { id: null, ...DEFAULT_ACCOUNTS, fiscalYearStartMonth: 1 };
  return { ...fixed, revenueAccounts: mappings };
}
