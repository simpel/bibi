"use client";

import type { BillingConfigDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import {
  type BillingConfigFormOutput,
  type BillingConfigFormValues,
  useBillingConfigForm,
} from "./use-billing-config-form";

export type BillingConfigFormProps = {
  config: BillingConfigDto;
  onSaved?: (() => void) | undefined;
};

type SecretFieldProps = {
  form: UseFormReturn<BillingConfigFormValues, unknown, BillingConfigFormOutput>;
  name: "secretKey" | "webhookSecret";
  label: string;
  hint: string;
  placeholder: string;
};

/** A write-only secret: never shown back, blank keeps the stored one. */
function SecretField({ form, name, label, hint, placeholder }: SecretFieldProps) {
  return (
    <div className="grid gap-1">
      <TextField
        form={form}
        name={name}
        label={label}
        type="password"
        autoComplete="off"
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

/** The platform's Stripe key and, locally, the webhook secret (ADR 0095 §1). Never env variables. */
export function BillingConfigForm({ config, onSaved }: BillingConfigFormProps) {
  const t = useTranslations("admin.billing.config");
  const { form, submit, pending } = useBillingConfigForm({ onSaved });
  const { secretKeyHint, hasWebhookSecret } = config;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-lg gap-4">
        <SecretField
          form={form}
          name="secretKey"
          label={t("secretKey")}
          hint={secretKeyHint ? t("secretKeyStored", { hint: secretKeyHint }) : t("noKey")}
          placeholder={secretKeyHint ? `•••• ${secretKeyHint}` : "sk_live_…"}
        />
        <SecretField
          form={form}
          name="webhookSecret"
          label={t("webhookSecret")}
          hint={t("webhookSecretHint")}
          placeholder={hasWebhookSecret ? "••••" : "whsec_…"}
        />
        <div>
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
