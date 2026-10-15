import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { ContactOption } from "./inquiry-form-data";
import type { InquiryFormOutput } from "./inquiry-form-schema";
import type { InquiryFormValues } from "./inquiry-form-values";

export type InquiryCoreFieldsProps = {
  form: UseFormReturn<InquiryFormValues, unknown, InquiryFormOutput>;
  customers: readonly NamedOption[];
  contacts: readonly ContactOption[];
};

/** Customer, contact, desired dates, quantity and budget (the type's own fields come after). */
export function InquiryCoreFields({ form, customers, contacts }: InquiryCoreFieldsProps) {
  const t = useTranslations("inquiry.fields");
  const ofCustomer = contacts.filter(({ customerId }) => customerId === form.watch("customerId"));
  return (
    <>
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("customer")}
        options={customers}
        onChange={() => form.setValue("contactId", NONE)}
      />
      <OptionSelectField
        control={form.control}
        name="contactId"
        label={t("contact")}
        options={ofCustomer}
        noneLabel={t("noContact")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="desiredStartsAt"
          label={t("desiredStartsAt")}
          type="datetime-local"
        />
        <TextField
          form={form}
          name="desiredEndsAt"
          label={t("desiredEndsAt")}
          type="datetime-local"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="quantity" label={t("quantity")} type="number" />
        <TextField form={form} name="budget" label={t("budget")} type="number" step="0.01" />
      </div>
    </>
  );
}
