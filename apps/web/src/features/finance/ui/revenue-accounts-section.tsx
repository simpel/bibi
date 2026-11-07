import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
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
    <AdminSection
      id="revenue-accounts"
      title={t("groups.revenueByType")}
      description={t("revenueByTypeHint")}
      actions={canEdit ? <AddAccountButton settings={settings} types={types} /> : null}
    >
      <AccountsTable
        tableId="finance.revenue-accounts"
        rows={typeRows({ settings, types })}
        settings={settings}
        types={types}
        grouped={false}
        emptyText={t("emptyRevenue")}
        canEdit={canEdit}
        scope="revenue"
      />
    </AdminSection>
  );
}
