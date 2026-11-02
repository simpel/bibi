import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { typeRows } from "../lib/account-rows";
import type { ItemTypeOption } from "../lib/accounting-form";
import { AccountsTable } from "./accounts-table";
import { AddAccountButton } from "./add-account-button";

export type RevenueAccountsSectionProps = {
  settings: AccountingSettingsDto;
  types: ItemTypeOption[];
  canEdit: boolean;
};

/** Revenue accounts per item type: the one list rows can be added to. */
export async function RevenueAccountsSection({
  settings,
  types,
  canEdit,
}: RevenueAccountsSectionProps) {
  const t = await getTranslations("finance.accounting");
  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-base">{t("groups.revenueByType")}</h2>
          <p className="text-sm text-muted-foreground">{t("revenueByTypeHint")}</p>
        </div>
        {canEdit ? <AddAccountButton settings={settings} types={types} /> : null}
      </div>
      <AccountsTable
        tableId="finance.revenue-accounts"
        rows={typeRows({ settings, types })}
        settings={settings}
        types={types}
        grouped={false}
        emptyText={t("emptyRevenue")}
        canEdit={canEdit}
      />
    </section>
  );
}
