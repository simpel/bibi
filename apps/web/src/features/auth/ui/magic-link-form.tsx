"use client";

import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { EmailField } from "@/components/form/email-field";
import { useZodMessages } from "@/lib/use-zod-messages";
import { EmailSchema, type EmailValues } from "./auth-schemas";
import { useSendLink } from "./use-send-link";

export type MagicLinkFormProps = { next: string };

/** Sign-in: the only method is a link by mail (ADR 0005). */
export function MagicLinkForm({ next }: MagicLinkFormProps) {
  const t = useTranslations("auth");
  const messages = useZodMessages();
  const { sentTo, pending, send } = useSendLink({ next });
  const form = useForm<EmailValues>({
    mode: "onBlur",
    resolver: zodResolver(EmailSchema, messages),
    defaultValues: { email: "" },
  });
  const onSubmit = form.handleSubmit((values) => send(values));
  if (sentTo) return <output className="block">{t("magicLinkSent", { email: sentTo })}</output>;
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <EmailField form={form} name="email" label={t("email")} required />
        <Button type="submit" disabled={pending}>
          {t("magicLink")}
        </Button>
      </form>
    </Form>
  );
}
