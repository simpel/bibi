import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { CustomerFormOutput } from "./customer-form-schema";
import type { CustomerFormValues } from "./customer-form-values";

export type CustomerCoreFieldsProps = {
  form: UseFormReturn<CustomerFormValues, unknown, CustomerFormOutput>;
};

/** Name, contact details, invoice address and terms (the type's own fields come after). */
export function CustomerCoreFields({ form }: CustomerCoreFieldsProps) {
  const t = useTranslations("customer.fields");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="email" label={t("email")} type="email" />
        <TextField form={form} name="phone" label={t("phone")} type="tel" />
      </div>
      <TextField form={form} name="invoiceStreetAddress" label={t("invoiceStreetAddress")} />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField form={form} name="invoicePostalCode" label={t("invoicePostalCode")} />
        <TextField form={form} name="invoiceCity" label={t("invoiceCity")} />
        <TextField form={form} name="invoiceCountry" label={t("invoiceCountry")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="paymentTermsDays"
          label={t("paymentTermsDays")}
          type="number"
        />
        <TextField form={form} name="creditLimit" label={t("creditLimit")} type="number" />
      </div>
    </>
  );
}
