import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { QuickBookingData } from "./quick-booking-data";
import type { QuickBookingFormOutput, QuickBookingFormValues } from "./quick-booking-form-schema";

export type QuickBookingFieldsProps = {
  form: UseFormReturn<QuickBookingFormValues, unknown, QuickBookingFormOutput>;
  data: QuickBookingData;
};

/** Payment method and the two types. */
function QuickBookingChoiceFields({ form, data }: QuickBookingFieldsProps) {
  const t = useTranslations("booking.quick");
  const payment = [
    { id: "INVOICE", name: t("invoice") },
    { id: "PAYMENT_LINK", name: t("paymentLink") },
  ];
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="paymentMethod"
        label={t("paymentMethod")}
        options={payment}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name="entityTypeId"
          label={t("bookingType")}
          options={data.bookingTypes}
        />
        <OptionSelectField
          control={form.control}
          name="programItemTypeId"
          label={t("programItemType")}
          options={data.programItemTypes}
        />
      </div>
    </>
  );
}

/** Customer, room, time and quantity, then the payment method and types. */
export function QuickBookingFields({ form, data }: QuickBookingFieldsProps) {
  const t = useTranslations("booking.quick");
  const bt = useTranslations("booking.fields");
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={data.customers}
      />
      <OptionSelectField
        control={form.control}
        name="itemId"
        label={t("item")}
        options={data.items}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="startsAt"
          label={bt("startsAt")}
          type="datetime-local"
          required
        />
        <TextField form={form} name="endsAt" label={bt("endsAt")} type="datetime-local" required />
      </div>
      <TextField form={form} name="quantity" label={t("quantity")} type="number" required />
      <QuickBookingChoiceFields form={form} data={data} />
    </>
  );
}
