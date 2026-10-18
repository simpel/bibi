"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { PriceListFormData } from "./load-price-list-form-data";
import type { PriceListFormOutput, PriceListFormValues } from "./price-list-form-schema";

export type PriceListStepFieldsProps = {
  form: UseFormReturn<PriceListFormValues, unknown, PriceListFormOutput>;
};

/** Name and the customer the list is for. */
export function PriceListIdentityFields({
  form,
  data,
}: PriceListStepFieldsProps & { data: PriceListFormData }) {
  const t = useTranslations("priceList");
  return (
    <>
      <TextField form={form} name="name" label={t("fields.name")} required />
      <OptionSelectField
        control={form.control}
        name="customerId"
        label={t("fields.customer")}
        options={data.customers}
        noneLabel={t("noCustomer")}
      />
    </>
  );
}

/** Validity and the general discount (item prices are edited separately). */
export function PriceListTermsFields({ form }: PriceListStepFieldsProps) {
  const t = useTranslations("priceList");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="validFrom" label={t("fields.validFrom")} type="date" />
        <TextField form={form} name="validTo" label={t("fields.validTo")} type="date" />
      </div>
      <TextField
        form={form}
        name="discountPercent"
        label={t("fields.discountPercent")}
        type="number"
        step="0.01"
      />
      <p className="text-sm text-muted-foreground">{t("discountHint")}</p>
    </>
  );
}
