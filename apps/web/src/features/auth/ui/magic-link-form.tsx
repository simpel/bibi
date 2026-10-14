"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@okazi/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { EmailSchema, type EmailValues } from "./auth-schemas";
import { useAuthFormAction } from "./use-auth-form-action";

export type MagicLinkFormProps = { next: string };

export function MagicLinkForm({ next }: MagicLinkFormProps) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const locale = useLocale();
  const messages = useZodMessages();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<EmailValues>({
    resolver: zodResolver(EmailSchema, messages),
    defaultValues: { email: "" },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit(({ email }) =>
    run({
      call: () => authClient.signIn.magicLink({ email, callbackURL: `/${locale}${next}` }),
      messages: { pending: common("sending"), success: t("linkSent") },
      onSuccess: () => setSentTo(email),
    }),
  );
  if (sentTo) return <output className="block">{t("magicLinkSent", { email: sentTo })}</output>;
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="email"
          label={t("email")}
          type="email"
          autoComplete="email"
          required
        />
        <Button type="submit" disabled={pending}>
          {t("magicLink")}
        </Button>
      </form>
    </Form>
  );
}
