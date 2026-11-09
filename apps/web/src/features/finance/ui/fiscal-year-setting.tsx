"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { AutoSaveSelect } from "@/components/form/auto-save-select";
import { updateAccountingSettingsAction } from "../actions";

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

export type FiscalYearSelectProps = {
  month: number;
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: ((input: { value: AccountingSettingsDto }) => void) | undefined;
};

/** The first month of the fiscal year, saved on change; shared with the setting card. */
export function FiscalYearSelect({ month, canEdit, onSaved }: FiscalYearSelectProps) {
  const t = useTranslations("finance.accounting");
  return (
    <AutoSaveSelect
      label={t("fields.fiscalYearStartMonth")}
      value={String(month)}
      options={MONTHS.map((value) => ({ value, label: t("monthName", { month: value }) }))}
      canEdit={canEdit}
      save={({ value }) =>
        updateAccountingSettingsAction({ input: { fiscalYearStartMonth: Number(value) } })
      }
      saved={t("saved")}
      onSaved={onSaved}
    />
  );
}

export type FiscalYearSettingProps = {
  settings: AccountingSettingsDto;
  canEdit: boolean;
};

/** The first month of the fiscal year: a setting that saves on change, not a table row. */
export function FiscalYearSetting({ settings, canEdit }: FiscalYearSettingProps) {
  const t = useTranslations("finance.accounting");
  return (
    <AdminSection section="fiscalYear">
      <FiscalYearSelect month={settings.fiscalYearStartMonth} canEdit={canEdit} />
      {canEdit ? null : <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
    </AdminSection>
  );
}
