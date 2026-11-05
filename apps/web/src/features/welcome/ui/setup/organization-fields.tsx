"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { CountryField } from "@/components/form/country-field";
import { EmailField } from "@/components/form/email-field";
import { PhoneField } from "@/components/form/phone-field";
import { TextField } from "@/components/form/text-field";
import { WebsiteField } from "@/components/form/website-field";
import type { OrganizationStepOutput, OrganizationStepValues } from "./organization-schema";

export type OrganizationFieldsProps = {
  form: UseFormReturn<OrganizationStepValues, unknown, OrganizationStepOutput>;
  canCreateVenue: boolean;
};

type Key = Exclude<keyof OrganizationStepValues, "alsoVenue" | "country">;

/** Legal name, number, address, website and contact, in the order a quote shows them. */
export function OrganizationFields({ form, canCreateVenue }: OrganizationFieldsProps) {
  const t = useTranslations("welcome.setup.organization");
  const text = ({
    name,
    extra = {},
  }: {
    name: Key;
    extra?: { type?: "email" | "tel"; autoComplete?: string };
  }) => <TextField form={form} name={name} label={t(name)} {...extra} />;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {text({ name: "legalName", extra: { autoComplete: "organization" } })}
        {text({ name: "orgNumber" })}
      </div>
      {text({ name: "streetAddress", extra: { autoComplete: "street-address" } })}
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr_13rem]">
        {text({ name: "postalCode", extra: { autoComplete: "postal-code" } })}
        {text({ name: "city", extra: { autoComplete: "address-level2" } })}
        <CountryField form={form} name="country" label={t("country")} />
      </div>
      <WebsiteField form={form} name="website" label={t("website")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <EmailField form={form} name="contactEmail" label={t("contactEmail")} />
        <PhoneField form={form} name="contactPhone" label={t("contactPhone")} />
      </div>
      {canCreateVenue ? <CheckField form={form} name="alsoVenue" label={t("alsoVenue")} /> : null}
    </>
  );
}
