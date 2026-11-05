"use client";

import { type InviteCodeInput, InviteCodeInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { redeemInviteCodeAction } from "../../join-actions";
import { JOIN_PATHS } from "../../lib/join-paths";

export type InviteCodeFormProps = {
  code?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "link";
  buttonText?: string;
};

/** `/welcome/join`: the code from an invitation mail (ADR 0078), prefilled from its link. */
export function InviteCodeForm({
  code = "",
  buttonVariant = "default",
  buttonText,
}: InviteCodeFormProps = {}) {
  const t = useTranslations("welcome.join");
  const router = useRouter();
  const form = useForm<InviteCodeInput>({
    mode: "onBlur",
    resolver: zodResolver(InviteCodeInputSchema, useZodMessages()),
    defaultValues: { code },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => redeemInviteCodeAction({ input: values }),
    messages: { pending: t("checkingCode"), success: t("codeAccepted") },
    onSuccess: () => router.push(JOIN_PATHS.organizations),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="code" label={t("code")} required />
        <p className="text-sm text-muted-foreground">{t("codeHint")}</p>
        <Button type="submit" variant={buttonVariant} className="w-full" disabled={pending}>
          {buttonText ?? t("useCode")}
        </Button>
      </form>
    </Form>
  );
}
