"use client";

import type { VenueCreateInput } from "@bibi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { TimeZoneField } from "@/components/form/time-zone-field";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import type { VenueFormValues } from "./venue-form-schema";

export type VenueStepFieldsProps = {
  form: UseFormReturn<VenueFormValues, unknown, VenueCreateInput>;
};

export function VenueIdentityFields({ form }: VenueStepFieldsProps) {
  const t = useTranslations("venue.fields");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="description" label={t("description")} multiline />
    </>
  );
}

/** Address and zone: a venue inherits the organization's zone unless it sets its own (ADR 0064). */
export function VenueAddressFields({ form }: VenueStepFieldsProps) {
  const t = useTranslations("venue.fields");
  const zone = useOrganizationTimeZone();
  return (
    <>
      <TextField form={form} name="streetAddress" label={t("streetAddress")} />
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="postalCode" label={t("postalCode")} />
        <TextField form={form} name="city" label={t("city")} />
      </div>
      <TextField form={form} name="country" label={t("country")} />
      <TimeZoneField
        control={form.control}
        name="timeZone"
        label={t("timeZone")}
        inheritLabel={t("timeZoneInherit", { zone })}
      />
    </>
  );
}

export function VenueContactFields({ form }: VenueStepFieldsProps) {
  const t = useTranslations("venue.fields");
  return (
    <>
      <TextField form={form} name="contactEmail" label={t("contactEmail")} type="email" />
      <TextField form={form} name="contactPhone" label={t("contactPhone")} type="tel" />
      <TextField form={form} name="openingHours" label={t("openingHours")} />
      <TextField
        form={form}
        name="defaultVatRatePercent"
        label={t("defaultVatRatePercent")}
        type="number"
      />
    </>
  );
}
