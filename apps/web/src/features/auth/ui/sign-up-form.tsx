"use client";

import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/lib/navigation";
import { useZodMessages } from "@/lib/use-zod-messages";
import { SignUpSchema, type SignUpValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { SignUpFields } from "./sign-up-fields";
import { useAuthFormAction } from "./use-auth-form-action";

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
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit((values) =>
    run({
      call: () => authClient.signUp.email(values),
      messages: { pending: t("creatingAccount"), success: t("accountCreated") },
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
        <SignUpFields form={form} />
        <Button type="submit" disabled={pending}>
          {t("signUp")}
        </Button>
      </form>
    </Form>
  );
}
