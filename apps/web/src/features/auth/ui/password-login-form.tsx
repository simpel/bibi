"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { SignInSchema, type SignInValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { useAuthSubmit } from "./use-auth-submit";

export type PasswordLoginFormProps = { next: string };

export function PasswordLoginForm({ next }: PasswordLoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema, messages),
    defaultValues: { email: "", password: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.signIn.email(values),
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
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
  );
}
