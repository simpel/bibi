"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { AdminSection } from "@/components/admin/admin-section";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateAccountingSettingsAction } from "../actions";

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

export type FiscalYearSelectProps = {
  month: number;
  canEdit: boolean;
  /** After a save; without it the page refreshes. The assistant's card keeps the new value. */
  onSaved?: (input: { value: AccountingSettingsDto }) => void;
};

/** The first month of the fiscal year, saved on change with a toast; shared with the chat card. */
export function FiscalYearSelect({ month, canEdit, onSaved }: FiscalYearSelectProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const id = useId();
  const save = ({ next }: { next: string }) =>
    run({
      action: () =>
        updateAccountingSettingsAction({ input: { fiscalYearStartMonth: Number(next) } }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: ({ value }) => (onSaved ? onSaved({ value }) : router.refresh()),
    });
  return (
    <div className="grid max-w-xs gap-2">
      <Label htmlFor={id}>{t("fields.fiscalYearStartMonth")}</Label>
      <Select
        value={String(month)}
        onValueChange={(next) => save({ next })}
        disabled={!canEdit || pending}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((value) => (
            <SelectItem key={value} value={value}>
              {t("monthName", { month: value })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
