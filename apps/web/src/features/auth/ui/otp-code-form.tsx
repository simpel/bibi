"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useZodMessages } from "@/lib/use-zod-messages";
import { OtpSchema, type OtpValues } from "./auth-schemas";
import { finishSignIn } from "./finish-sign-in";
import { useAuthFormAction } from "./use-auth-form-action";

export type OtpCodeFormProps = { email: string; next: string };

/** Step 2 of the code sign-in ("code sent" was step 1's success toast, not repeated here). */
export function OtpCodeForm({ email, next }: OtpCodeFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const messages = useZodMessages();
  const form = useForm<OtpValues>({
    resolver: zodResolver(OtpSchema, messages),
    defaultValues: { code: "" },
  });
  const { pending, run } = useAuthFormAction();
  const onSubmit = form.handleSubmit(({ code }) =>
    run({
      call: () => authClient.signIn.emailOtp({ email, otp: code }),
      messages: { pending: t("verifyingCode"), success: t("signedIn") },
      onSuccess: () => finishSignIn({ router, next }),
    }),
  );
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="grid gap-4">
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
    </Form>
  );
}
