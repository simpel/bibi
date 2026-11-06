"use client";

import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EmailField } from "@/components/form/email-field";
import { TextField } from "@/components/form/text-field";
import { useZodMessages } from "@/lib/use-zod-messages";
import { SignUpSchema, type SignUpValues } from "./auth-schemas";
import { useSendLink } from "./use-send-link";

export type SignUpFormProps = { next: string };

/**
 * Sign-up: name and email, then a link by mail. The first link creates the user; the new session
 * has no organization yet, so the guard routes on to /welcome (ADR 0005).
 */
export function SignUpForm({ next }: SignUpFormProps) {
  const t = useTranslations("auth");
  const messages = useZodMessages();
  const { sentTo, pending, send } = useSendLink({ next });
  const form = useForm<SignUpValues>({
    mode: "onBlur",
    resolver: zodResolver(SignUpSchema, messages),
    defaultValues: { name: "", email: "" },
  });
  const onSubmit = form.handleSubmit((values) => send(values));
  if (sentTo) return <output className="block">{t("magicLinkSent", { email: sentTo })}</output>;
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("name")} autoComplete="name" required />
        <EmailField form={form} name="email" label={t("email")} required />
        <Button type="submit" disabled={pending}>
          {t("signUp")}
        </Button>
      </form>
    </Form>
  );
}
