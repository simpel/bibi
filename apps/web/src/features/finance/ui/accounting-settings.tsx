import { getAccountingSettings, listEntityTypes } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { listAll } from "@/server/list-all";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { accountRows } from "../lib/account-rows";
import { AccountsTable } from "./accounts-table";
import { FiscalYearSetting } from "./fiscal-year-setting";
import { RevenueAccountsSection } from "./revenue-accounts-section";

export type AccountingSettingsProps = { locale: Locale };

/** `/settings/accounting`: the accounts the SIE export books to (ADR 0077 decision 4). */
export async function AccountingSettings({ locale }: AccountingSettingsProps) {
  const t = await getTranslations("finance.accounting");
  const abilities = await getCallerAbilities();
  const [settingsResult, itemTypes] = await Promise.all([
    runOperation({ operation: getAccountingSettings, input: {} }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" } }),
  ]);
  if (!settingsResult.ok)
    return <ErrorState errorKey={handleLoadError({ error: settingsResult.error, locale })} />;
  if (!itemTypes.ok)
    return <ErrorState errorKey={handleLoadError({ error: itemTypes.error, locale })} />;
  const settings = settingsResult.value;
  const types = itemTypes.value.map(({ id, name }) => ({ id, name }));
  const canEdit = can({ abilities, permission: "finance:write" });
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <FiscalYearSetting settings={settings} canEdit={canEdit} />
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">{t("groups.accounts")}</h2>
        <AccountsTable
          tableId="finance.accounts"
          rows={accountRows({ settings })}
          settings={settings}
          types={types}
          grouped
          emptyText={t("empty")}
          canEdit={canEdit}
        />
      </section>
      <RevenueAccountsSection settings={settings} types={types} canEdit={canEdit} />
      {canEdit ? null : <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
    </div>
  );
}
