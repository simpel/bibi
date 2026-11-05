"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { EmailField } from "@/components/form/email-field";
import { TextField } from "@/components/form/text-field";
import type { SignUpValues } from "./auth-schemas";

export type SignUpFieldsProps = { form: UseFormReturn<SignUpValues, unknown, SignUpValues> };

export function SignUpFields({ form }: SignUpFieldsProps) {
  const t = useTranslations("auth");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} autoComplete="name" required />
      <EmailField form={form} name="email" label={t("email")} required />
      <TextField
        form={form}
        name="password"
        label={t("password")}
        type="password"
        autoComplete="new-password"
        required
      />
      <p className="-mt-2 text-xs text-muted-foreground">{t("passwordHint")}</p>
    </>
  );
}
