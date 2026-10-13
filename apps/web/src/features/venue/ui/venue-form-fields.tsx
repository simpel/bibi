"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { VenueFormValues } from "./venue-form-schema";

export type VenueFormFieldsProps = {
  form: UseFormReturn<VenueFormValues, unknown, never>;
};

export function VenueFormFields({ form }: VenueFormFieldsProps) {
  const t = useTranslations("venue.fields");
  return (
    <div className="grid gap-4">
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="description" label={t("description")} multiline />
      <TextField form={form} name="streetAddress" label={t("streetAddress")} />
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="postalCode" label={t("postalCode")} />
        <TextField form={form} name="city" label={t("city")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="country" label={t("country")} />
        <TextField form={form} name="defaultVatRatePercent" label={t("defaultVatRatePercent")} type="number" />
      </div>
      <TextField form={form} name="contactEmail" label={t("contactEmail")} type="email" />
      <TextField form={form} name="contactPhone" label={t("contactPhone")} type="tel" />
      <TextField form={form} name="openingHours" label={t("openingHours")} />
    </div>
  );
}
