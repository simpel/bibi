"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { EmailSchema, type EmailValues } from "./auth-schemas";
import { useAuthFormAction } from "./use-auth-form-action";

export type OtpEmailFormProps = { onSent: (email: string) => void };

/** Step 1 of the code sign-in; the success toast is the only "code sent" message. */
export function OtpEmailForm({ onSent }: OtpEmailFormProps) {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const messages = useZodMessages();
  const form = useForm<EmailValues>({
    resolver: zodResolver(EmailSchema, messages),
    defaultValues: { email: "" },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit(({ email }) =>
    run({
      call: () => authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }),
      messages: { pending: common("sending"), success: t("codeSent", { email }) },
      onSuccess: () => onSent(email),
    }),
  );
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
          {t("sendCode")}
        </Button>
      </form>
    </Form>
  );
}
