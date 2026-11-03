"use client";

import { BillingConfigProvisionInputSchema } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { provisionBillingConfigAction } from "./actions";

type ProvisionValues = { webhookUrl: string };
type ProvisionOutput = z.infer<typeof BillingConfigProvisionInputSchema>;

const provisionSchema = formSchema({
  schema: BillingConfigProvisionInputSchema,
  toInput: ({ values }: { values: ProvisionValues }) => ({
    webhookUrl: values.webhookUrl.trim() === "" ? undefined : values.webhookUrl.trim(),
  }),
});

export type ProvisionFormProps = {
  /** The app's https webhook URL, or "" locally (Stripe calls only https). */
  defaultWebhookUrl: string;
  /** A key must be stored before anything can be created in Stripe. */
  hasKey: boolean;
};

/** "Create in Stripe" (ADR 0095 §2): idempotent, so it is safe to run again. */
export function ProvisionForm({ defaultWebhookUrl, hasKey }: ProvisionFormProps) {
  const t = useTranslations("admin.billing.provision");
  const router = useRouter();
  const form = useForm<ProvisionValues, unknown, ProvisionOutput>({
    resolver: zodResolver(provisionSchema, useZodMessages()),
    defaultValues: { webhookUrl: defaultWebhookUrl },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => provisionBillingConfigAction({ input: values }),
    messages: { pending: t("running"), success: t("done") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-lg gap-3">
        <TextField form={form} name="webhookUrl" label={t("webhookUrl")} type="text" />
        <p className="-mt-1 text-xs text-muted-foreground">{t("webhookUrlHint")}</p>
        <div>
          <Button type="submit" variant="outline" disabled={pending || !hasKey}>
            {t("run")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
