"use client";

import type { ProfileUpdateInput } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";

export type ProfileFieldsProps = { form: UseFormReturn<ProfileUpdateInput> };

/** First name, last name and phone. */
export function ProfileFields({ form }: ProfileFieldsProps) {
  const t = useTranslations("welcome.profile");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          form={form}
          name="firstName"
          label={t("firstName")}
          autoComplete="given-name"
          required
        />
        <TextField
          form={form}
          name="lastName"
          label={t("lastName")}
          autoComplete="family-name"
          required
        />
      </div>
      <TextField
        form={form}
        name="phone"
        type="tel"
        label={t("phone")}
        autoComplete="tel"
        required
      />
    </>
  );
}
