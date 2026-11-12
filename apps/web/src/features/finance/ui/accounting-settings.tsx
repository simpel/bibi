import { getAccountingSettings } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { accountRows } from "../lib/account-rows";
import { AccountsTable } from "./accounts-table";
import { RevenueAccountsSection } from "./revenue-accounts-section";

export type AccountingSettingsProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/** `/admin/accounting`: the accounts rows raised in the accounting system post to (ADR 0077, 0106). */
export async function AccountingSettings({ locale, show }: AccountingSettingsProps) {
  const [t, abilities, settingsResult, itemTypes] = await Promise.all([
    getTranslations("finance.accounting"),
    getCallerAbilities(),
    runOperation({ operation: getAccountingSettings, input: {} }),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  if (!settingsResult.ok || !itemTypes.ok) {
    const error = !settingsResult.ok
      ? settingsResult.error
      : !itemTypes.ok
        ? itemTypes.error
        : null;
    const state = error ? (
      <ErrorState inline errorKey={handleLoadError({ error, locale })} />
    ) : null;
    return (
      <>
        {show.has("accounts") ? <AdminSection section="accounts">{state}</AdminSection> : null}
        {show.has("revenueAccounts") ? (
          <AdminSection section="revenueAccounts">{state}</AdminSection>
        ) : null}
      </>
    );
  }
  const settings = settingsResult.value;
  const types = itemTypes.value.items.map(({ id, name }) => ({ id, name }));
  const canEdit = can({ abilities, permission: "finance:write" });
  return (
    <>
      {show.has("accounts") ? (
        <AdminSection section="accounts">
          <AccountsTable
            tableId="finance.accounts"
            rows={accountRows({ settings })}
            settings={settings}
            types={types}
            emptyText={t("empty")}
            canEdit={canEdit}
          />
        </AdminSection>
      ) : null}
      {show.has("revenueAccounts") ? (
        <RevenueAccountsSection settings={settings} types={types} canEdit={canEdit} />
      ) : null}
    </>
  );
}
