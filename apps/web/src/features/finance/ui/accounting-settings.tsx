import { getAccountingSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { AdminSection } from "@/components/admin/admin-section";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { accountRows } from "../lib/account-rows";
import { AccountsTable } from "./accounts-table";
import { FiscalYearSetting } from "./fiscal-year-setting";
import { RevenueAccountsSection } from "./revenue-accounts-section";

export type AccountingSettingsProps = { locale: Locale };

/** `/admin/accounting`: the accounts the SIE export books to (ADR 0077 decision 4). */
export async function AccountingSettings({ locale }: AccountingSettingsProps) {
  const [t, abilities, settingsResult, itemTypes] = await Promise.all([
    getTranslations("finance.accounting"),
    getCallerAbilities(),
    runOperation({ operation: getAccountingSettings, input: {} }),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  const header = <AdminHeader title={t("title")} description={t("description")} />;
  const error = !settingsResult.ok ? settingsResult.error : !itemTypes.ok ? itemTypes.error : null;
  if (error || !settingsResult.ok || !itemTypes.ok) {
    return (
      <AdminPage header={header}>
        {error ? <ErrorState inline errorKey={handleLoadError({ error, locale })} /> : null}
      </AdminPage>
    );
  }
  const settings = settingsResult.value;
  const types = itemTypes.value.items.map(({ id, name }) => ({ id, name }));
  const canEdit = can({ abilities, permission: "finance:write" });
  return (
    <AdminPage header={header}>
      <FiscalYearSetting settings={settings} canEdit={canEdit} />
      <AdminSection id="accounts" title={t("groups.accounts")} flush>
        <AccountsTable
          tableId="finance.accounts"
          rows={accountRows({ settings })}
          settings={settings}
          types={types}
          grouped
          emptyText={t("empty")}
          canEdit={canEdit}
          flush
        />
      </AdminSection>
      <RevenueAccountsSection settings={settings} types={types} canEdit={canEdit} />
      {canEdit ? null : <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
    </AdminPage>
  );
}
