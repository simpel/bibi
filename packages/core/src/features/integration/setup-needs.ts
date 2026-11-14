import type { OperationContext } from "../../operations/types";
import type { SetupNeeds } from "../../providers/types";
import { loadAccountingSettings } from "../finance/load-settings";
import { effectiveRevenueAccount } from "../finance/settings-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** The VAT rate a setup check assumes when no item has one yet. */
const DEFAULT_VAT_RATE = 25;

/**
 * What Bibi books with (ADR 0077, 0108): the advances account, the default and every mapped
 * revenue account, and the VAT rates of the organization's active items.
 */
export async function loadSetupNeeds({ context }: Db): Promise<SetupNeeds> {
  const [settings, items] = await Promise.all([
    loadAccountingSettings({ context }),
    context.db.item.findMany({
      where: { vatRatePercent: { not: null } },
      select: { vatRatePercent: true },
      distinct: ["vatRatePercent"],
    }),
  ]);
  const revenue = [
    effectiveRevenueAccount({ settings }),
    ...settings.revenueAccounts.map((map) => map.account),
  ];
  const rates = items.flatMap((item) =>
    item.vatRatePercent === null ? [] : [item.vatRatePercent],
  );
  return {
    advancesAccount: settings.advancesAccount,
    revenueAccounts: [...new Set(revenue)],
    vatRates: rates.length > 0 ? rates.sort((a, b) => b - a) : [DEFAULT_VAT_RATE],
  };
}
