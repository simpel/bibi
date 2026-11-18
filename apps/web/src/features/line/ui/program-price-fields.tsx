import type { LineDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";

export type ProgramPriceFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
  /** The saved line's prices in effect, shown as placeholders; unknown for a new line. */
  inherited?:
    | Pick<
        LineDto,
        "effectiveUnitPriceMinor" | "effectiveDiscountPercent" | "effectiveVatRatePercent"
      >
    | undefined;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? undefined : String(value);

/** The line's price, discount and VAT (ADR 0052); empty inherits, shown as the placeholder. */
export function ProgramPriceFields({ form, inherited }: ProgramPriceFieldsProps) {
  const t = useTranslations("line.fields");
  const number = { form, type: "number" } as const;
  const minor = inherited?.effectiveUnitPriceMinor;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField
        {...number}
        name="unitPrice"
        label={t("unitPrice")}
        step="0.01"
        placeholder={text({ value: minor === null || minor === undefined ? minor : minor / 100 })}
      />
      <TextField
        {...number}
        name="discountPercent"
        label={t("discountPercent")}
        step="0.01"
        placeholder={text({ value: inherited?.effectiveDiscountPercent })}
      />
      <TextField
        {...number}
        name="vatRatePercent"
        label={t("vatRatePercent")}
        placeholder={text({ value: inherited?.effectiveVatRatePercent })}
      />
    </div>
  );
}
