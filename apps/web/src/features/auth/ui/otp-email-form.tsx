"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { type EmailValues, EmailSchema } from "./auth-schemas";
import { useAuthSubmit } from "./use-auth-submit";

export type OtpEmailFormProps = { onSent: (email: string) => void };

export function OtpEmailForm({ onSent }: OtpEmailFormProps) {
  const t = useTranslations("auth");
  const messages = useZodMessages();
  const form = useForm<EmailValues>({
    resolver: zodResolver(EmailSchema, messages),
    defaultValues: { email: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit(({ email }) =>
    run({
      call: () => authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
      onSuccess: () => onSent(email),
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <TextField form={form} name="email" label={t("email")} type="email" autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {t("sendCode")}
      </Button>
    </form>
  );
}
