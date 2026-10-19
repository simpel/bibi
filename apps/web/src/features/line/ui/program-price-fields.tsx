import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { LineFormOutput } from "./line-form-schema";
import type { LineFormValues } from "./line-form-values";

export type ProgramPriceFieldsProps = {
  form: UseFormReturn<LineFormValues, unknown, LineFormOutput>;
};

/** The line's own price, discount and VAT (ADR 0052); empty inherits. */
export function ProgramPriceFields({ form }: ProgramPriceFieldsProps) {
  const t = useTranslations("line.fields");
  const number = { form, type: "number" } as const;
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <TextField {...number} name="unitPrice" label={t("unitPrice")} step="0.01" />
      <TextField {...number} name="discountPercent" label={t("discountPercent")} step="0.01" />
      <TextField {...number} name="vatRatePercent" label={t("vatRatePercent")} />
    </div>
  );
}
