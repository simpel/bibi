import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { EmailField } from "@/components/form/email-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { PhoneField } from "@/components/form/phone-field";
import { TextField } from "@/components/form/text-field";
import type { CustomerFormOutput } from "./customer-form-schema";
import type { CustomerFormValues } from "./customer-form-values";

export type CustomerCoreFieldsProps = {
  form: UseFormReturn<CustomerFormValues, unknown, CustomerFormOutput>;
};

/**
 * Name, business or private with the org no., contact details, invoice address and terms (the
 * type's own fields come after).
 */
export function CustomerCoreFields({ form }: CustomerCoreFieldsProps) {
  const t = useTranslations("customer.fields");
  const kinds = useTranslations("customer.buyerKind");
  const business = form.watch("buyerKind") !== "PRIVATE";
  const options = [
    { id: "BUSINESS", name: kinds("BUSINESS") },
    { id: "PRIVATE", name: kinds("PRIVATE") },
  ];
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name="buyerKind"
          label={t("buyerKind")}
          options={options}
        />
        {business ? (
          <TextField form={form} name="organizationNumber" label={t("organizationNumber")} />
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <EmailField form={form} name="email" label={t("email")} />
        <PhoneField form={form} name="phone" label={t("phone")} />
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
