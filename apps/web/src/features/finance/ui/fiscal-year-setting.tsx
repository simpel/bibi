"use client";

import type { AccountingSettingsDto } from "@bibi/core/schemas";
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { updateAccountingSettingsAction } from "../actions";

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

export type FiscalYearSettingProps = {
  settings: AccountingSettingsDto;
  canEdit: boolean;
};

/** The first month of the fiscal year: a setting that saves on change, not a table row. */
export function FiscalYearSetting({ settings, canEdit }: FiscalYearSettingProps) {
  const t = useTranslations("finance.accounting");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const save = ({ month }: { month: string }) =>
    run({
      action: () =>
        updateAccountingSettingsAction({ input: { fiscalYearStartMonth: Number(month) } }),
      messages: { pending: common("saving"), success: t("saved") },
      onSuccess: () => router.refresh(),
    });
  return (
    <AdminSection section="fiscalYear">
      <div className="grid max-w-xs gap-2">
        <Label htmlFor="fiscal-year-start">{t("fields.fiscalYearStartMonth")}</Label>
        <Select
          value={String(settings.fiscalYearStartMonth)}
          onValueChange={(month) => save({ month })}
          disabled={!canEdit || pending}
        >
          <SelectTrigger id="fiscal-year-start">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem key={month} value={month}>
                {t("monthName", { month })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {canEdit ? null : <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
    </AdminSection>
  );
}
