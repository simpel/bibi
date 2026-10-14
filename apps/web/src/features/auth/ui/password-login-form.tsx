"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { SignInSchema, type SignInValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { useAuthFormAction } from "./use-auth-form-action";

export type PasswordLoginFormProps = { next: string };

function usePasswordLogin({ next }: PasswordLoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema, messages),
    defaultValues: { email: "", password: "" },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.signIn.email(values),
      messages: { pending: t("signingIn"), success: t("signedIn") },
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return { form, pending, onSubmit };
}

export function PasswordLoginForm({ next }: PasswordLoginFormProps) {
  const t = useTranslations("auth");
  const { form, pending, onSubmit } = usePasswordLogin({ next });
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
        <TextField
          form={form}
          name="password"
          label={t("password")}
          type="password"
          autoComplete="current-password"
          required
        />
        <Button type="submit" disabled={pending}>
          {t("signIn")}
        </Button>
      </form>
    </Form>
  );
}
