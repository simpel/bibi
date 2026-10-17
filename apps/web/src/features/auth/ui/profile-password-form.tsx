"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { ChangePasswordSchema, type ChangePasswordValues } from "./auth-schemas";
import { useAuthFormAction } from "./use-auth-form-action";

const EMPTY: ChangePasswordValues = { currentPassword: "", newPassword: "" };

function usePasswordForm() {
  const t = useTranslations("profile");
  const messages = useZodMessages();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(ChangePasswordSchema, messages),
    defaultValues: EMPTY,
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.changePassword({ ...values, revokeOtherSessions: true }),
      messages: { pending: t("savingPassword"), success: t("passwordSaved") },
      onSuccess: () => form.reset(EMPTY),
    }),
  );
  return { form, pending, onSubmit };
}

/** Change password with the current one; other sessions are signed out by Better Auth. */
export function ProfilePasswordForm() {
  const t = useTranslations("profile");
  const auth = useTranslations("auth");
  const { form, pending, onSubmit } = usePasswordForm();
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="currentPassword"
          label={t("currentPassword")}
          type="password"
          autoComplete="current-password"
          required
        />
        <TextField
          form={form}
          name="newPassword"
          label={t("newPassword")}
          type="password"
          autoComplete="new-password"
          required
        />
        <p className="text-xs text-muted-foreground">{auth("passwordHint")}</p>
        <Button type="submit" disabled={pending} className="justify-self-start">
          {t("changePassword")}
        </Button>
      </form>
    </Form>
  );
}
