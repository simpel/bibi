import { getAccountingSettings, listEntityTypes } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { listAll } from "@/server/list-all";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { AccountingForm } from "./accounting-form";

export type AccountingSettingsProps = { locale: Locale };

/** `/settings/accounting`: the accounts the SIE export books to (ADR 0077 decision 4). */
export async function AccountingSettings({ locale }: AccountingSettingsProps) {
  const t = await getTranslations("finance.accounting");
  const abilities = await getCallerAbilities();
  const [settings, types] = await Promise.all([
    runOperation({ operation: getAccountingSettings, input: {} }),
    listAll({ operation: listEntityTypes, input: { base: "ITEM" } }),
  ]);
  if (!settings.ok)
    return <ErrorState errorKey={handleLoadError({ error: settings.error, locale })} />;
  if (!types.ok) return <ErrorState errorKey={handleLoadError({ error: types.error, locale })} />;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <AccountingForm
        settings={settings.value}
        types={types.value.map(({ id, name }) => ({ id, name }))}
        canEdit={can({ abilities, permission: "finance:write" })}
      />
    </div>
  );
}
