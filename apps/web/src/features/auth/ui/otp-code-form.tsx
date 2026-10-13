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
import { OtpSchema, type OtpValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { useAuthSubmit } from "./use-auth-submit";

export type OtpCodeFormProps = { email: string; next: string };

export function OtpCodeForm({ email, next }: OtpCodeFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<OtpValues>({
    resolver: zodResolver(OtpSchema, messages),
    defaultValues: { code: "" },
  });
  const { pending, errorKey, run } = useAuthSubmit();
  const onSubmit = form.handleSubmit(({ code }) =>
    run({
      call: () => authClient.signIn.emailOtp({ email, otp: code }),
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <p role="status" className="text-sm text-muted-foreground">
        {t("codeSent", { email })}
      </p>
      <ErrorBanner errorKey={errorKey} />
      <TextField
        form={form}
        name="code"
        label={t("otpCode")}
        autoComplete="one-time-code"
        required
      />
      <Button type="submit" disabled={pending}>
        {t("verifyCode")}
      </Button>
    </form>
  );
}
