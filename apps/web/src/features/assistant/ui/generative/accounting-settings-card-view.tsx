"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCan } from "@/components/shell/permissions-context";
import { accountRows } from "@/features/finance/lib/account-rows";
import { AccountsTable } from "@/features/finance/ui/accounts-table";
import { FiscalYearSelect } from "@/features/finance/ui/fiscal-year-setting";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { SettingRow, SettingsCard } from "./settings-card";

export type AccountingSettingsCardViewProps = GenerativeProps<"accounting-settings-card">;

/**
 * The Accounting page's settings in the chat: the fiscal year and the fixed accounts, editable in
 * place. Revenue accounts per item type need the item types, so they stay on the page.
 */
export function AccountingSettingsCardView({ settings }: AccountingSettingsCardViewProps) {
  const nav = useTranslations("nav");
  const t = useTranslations("finance.accounting");
  const [current, setCurrent] = useState(settings);
  const canEdit = useCan({ permission: "finance:write" });
  return (
    <SettingsCard
      slot="accounting-settings-card"
      title={nav("accounting")}
      href={ROUTES.adminAccounting}
    >
      <SettingRow section="fiscalYear">
        <FiscalYearSelect
          month={current.fiscalYearStartMonth}
          canEdit={canEdit}
          onSaved={({ value }) => setCurrent(value)}
        />
      </SettingRow>
      <SettingRow section="accounts">
        <AccountsTable
          tableId="finance.accounts.assistant"
          rows={accountRows({ settings: current })}
          settings={current}
          types={[]}
          grouped
          emptyText={t("empty")}
          canEdit={canEdit}
          scope="chat-accounts"
          onSaved={({ value }) => setCurrent(value)}
        />
      </SettingRow>
    </SettingsCard>
  );
}
