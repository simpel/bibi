"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { ErrorBanner } from "@/components/states/error-banner";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { SignUpSchema, type SignUpValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { SignUpFields } from "./sign-up-fields";
import { useAuthSubmit } from "./use-auth-submit";

export type SignUpFormProps = { next: string };

/** Email + password sign-up; the new session has no organization yet, so the guard routes on. */
export function SignUpForm({ next }: SignUpFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(SignUpSchema, messages),
    defaultValues: { name: "", email: "", password: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.signUp.email(values),
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <ErrorBanner errorKey={errorKey} />
      <SignUpFields form={form} />
      <Button type="submit" disabled={pending}>
        {t("signUp")}
      </Button>
    </form>
  );
}
