import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { BookingFormOutput } from "./booking-form-schema";
import type { BookingFormValues } from "./booking-form-values";

export type BookingCoreFieldsProps = {
  form: UseFormReturn<BookingFormValues, unknown, BookingFormOutput>;
  customers: readonly NamedOption[];
};

/** Customer, time and headcount (the type's own fields come after). */
export function BookingCoreFields({ form, customers }: BookingCoreFieldsProps) {
  const t = useTranslations("booking.fields");
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={customers}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="startsAt"
          label={t("startsAt")}
          type="datetime-local"
          required
        />
        <TextField form={form} name="endsAt" label={t("endsAt")} type="datetime-local" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="estimatedHeadcount"
          label={t("estimatedHeadcount")}
          type="number"
        />
        <TextField
          form={form}
          name="guaranteedHeadcount"
          label={t("guaranteedHeadcount")}
          type="number"
        />
      </div>
    </>
  );
}
