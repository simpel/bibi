"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { accountRows } from "@/features/finance/lib/account-rows";
import { AccountsTable } from "@/features/finance/ui/accounts-table";
import { FiscalYearSelect } from "@/features/finance/ui/fiscal-year-setting";
import { SettingCard } from "./setting-card";
import type { SettingCardProps } from "./setting-props";

const savedAccounting =
  ({ onSaved }: Pick<SettingCardProps, "onSaved">) =>
  ({ value }: { value: AccountingSettingsDto }) =>
    onSaved({ patch: { accounting: value } });

/** The first month of the fiscal year, saved on change. */
export function FiscalYearSettingCard({ view, onSaved }: SettingCardProps) {
  const canEdit = useCan({ permission: "finance:write" });
  if (!view.accounting) return null;
  return (
    <SettingCard setting="fiscalYear">
      <FiscalYearSelect
        month={view.accounting.fiscalYearStartMonth}
        canEdit={canEdit}
        onSaved={savedAccounting({ onSaved })}
      />
    </SettingCard>
  );
}

/** The fixed accounts of the SIE export (ADR 0077), the Accounting page's table. */
export function AccountsSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("finance.accounting");
  const canEdit = useCan({ permission: "finance:write" });
  if (!view.accounting) return null;
  return (
    <SettingCard setting="accounts">
      <AccountsTable
        tableId="finance.accounts.assistant"
        rows={accountRows({ settings: view.accounting })}
        settings={view.accounting}
        types={[]}
        grouped
        emptyText={t("empty")}
        canEdit={canEdit}
        scope="chat-accounts"
        onSaved={savedAccounting({ onSaved })}
      />
    </SettingCard>
  );
}
