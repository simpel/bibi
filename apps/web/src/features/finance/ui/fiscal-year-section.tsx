import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import type { AccountingFormValues } from "../lib/accounting-form";

export type FiscalYearSectionProps = { control: Control<AccountingFormValues, unknown, unknown> };

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1));

/** The first month of the fiscal year, with month names from the UI language. */
export function FiscalYearSection({ control }: FiscalYearSectionProps) {
  const t = useTranslations("finance.accounting");
  const months = MONTHS.map((id) => ({ id, name: t("monthName", { month: id }) }));
  return (
    <section className="grid max-w-xs gap-3">
      <h2 className="text-base font-semibold">{t("groups.fiscalYear")}</h2>
      <OptionSelectField
        control={control}
        name="fiscalYearStartMonth"
        label={t("fields.fiscalYearStartMonth")}
        options={months}
      />
    </section>
  );
}
