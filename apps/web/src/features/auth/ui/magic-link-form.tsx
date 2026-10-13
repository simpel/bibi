"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@okazi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { type EmailValues, EmailSchema } from "./auth-schemas";
import { useAuthSubmit } from "./use-auth-submit";

export type MagicLinkFormProps = { next: string };

export function MagicLinkForm({ next }: MagicLinkFormProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const messages = useZodMessages();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailValues>({
    resolver: zodResolver(EmailSchema, messages),
    defaultValues: { email: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit(({ email }) =>
    run({
      call: () => authClient.signIn.magicLink({ email, callbackURL: `/${locale}${next}` }),
      onSuccess: () => setSentTo(email),
    }),
  );
  if (sentTo) return <p role="status">{t("magicLinkSent", { email: sentTo })}</p>;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <TextField form={form} name="email" label={t("email")} type="email" autoComplete="email" required />
      <Button type="submit" disabled={pending}>
        {t("magicLink")}
      </Button>
    </form>
  );
}
