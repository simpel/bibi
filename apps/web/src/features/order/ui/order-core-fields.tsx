import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { ContactOption } from "./order-form-data";
import type { OrderFormOutput } from "./order-form-schema";
import type { OrderFormValues } from "./order-form-values";

export type OrderFieldsForm = UseFormReturn<OrderFormValues, unknown, OrderFormOutput>;

type FormOnly = { form: OrderFieldsForm };

export type ContactFieldsProps = FormOnly & {
  data: {
    contacts: readonly ContactOption[];
    /** The caller may not view customers (and their contacts): the picker is disabled. */
    customersHidden: boolean;
  };
};

/** A contact person at the order's customer; the customer itself never changes after creation. */
export function ContactFields({ form, data }: ContactFieldsProps) {
  const t = useTranslations("order.fields");
  const customerId = form.watch("customerId");
  const ofCustomer = data.contacts.filter((contact) => contact.customerId === customerId);
  return (
    <OptionSelectField
      control={form.control}
      name="contactId"
      label={t("contact")}
      options={ofCustomer}
      hidden={data.customersHidden}
    />
  );
}

/** Business or private and the buyer's reference; both follow the customer and contact by default. */
export function BuyerFields({ form }: FormOnly) {
  const t = useTranslations("order.fields");
  const kinds = useTranslations("customer.buyerKind");
  const options = [
    { id: "BUSINESS", name: kinds("BUSINESS") },
    { id: "PRIVATE", name: kinds("PRIVATE") },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <OptionSelectField
        control={form.control}
        name="buyerKind"
        label={t("buyerKind")}
        options={options}
        noneLabel={t("buyerKindFromCustomer")}
      />
      <TextField
        form={form}
        name="buyerReference"
        label={t("buyerReference")}
        placeholder={t("buyerReferencePlaceholder")}
      />
    </div>
  );
}

/** The desired start and end. */
export function PeriodFields({ form }: FormOnly) {
  const t = useTranslations("order.fields");
  return (
    <>
      <DateTimeField form={form} name="desiredStartsAt" label={t("desiredStartsAt")} />
      <DateTimeField form={form} name="desiredEndsAt" label={t("desiredEndsAt")} />
    </>
  );
}

/** The estimated and the guaranteed headcount. */
export function HeadcountFields({ form }: FormOnly) {
  const t = useTranslations("order.fields");
  return (
    <div className="grid grid-cols-2 gap-4">
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
  );
}

/** Budget, estimated value, when soft holds expire and the booking note; all optional. */
export function MoneyAndNoteFields({ form }: FormOnly) {
  const t = useTranslations("order.fields");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="budget" label={t("budget")} type="number" step="0.01" />
        <TextField
          form={form}
          name="estimatedValue"
          label={t("estimatedValue")}
          type="number"
          step="0.01"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DateTimeField form={form} name="holdsUntil" label={t("holdsUntil")} />
      </div>
      <TextField form={form} name="note" label={t("note")} multiline rows={4} />
    </>
  );
}
