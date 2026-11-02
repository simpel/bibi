"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import { InvoiceProviderField } from "./invoice-provider-field";
import {
  type PaymentSettingsFormOutput,
  type PaymentSettingsFormValues,
  usePaymentSettingsForm,
} from "./use-payment-settings-form";

type SectionProps = {
  form: UseFormReturn<PaymentSettingsFormValues, unknown, PaymentSettingsFormOutput>;
};

function DepositSection({ form }: SectionProps) {
  const t = useTranslations("paymentSettings");
  return (
    <section className="grid max-w-lg gap-4">
      <div className="grid gap-1">
        <h2 className="text-base">{t("deposit.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("deposit.description")}</p>
      </div>
      <TextField
        form={form}
        name="depositPercent"
        label={t("fields.depositPercent")}
        type="number"
        step="1"
        placeholder={t("placeholders.none")}
      />
      <TextField
        form={form}
        name="depositMinimumMinor"
        label={t("fields.depositMinimum")}
        type="number"
        step="0.01"
        placeholder={t("placeholders.none")}
      />
      <p className="-mt-2 text-xs text-muted-foreground">{t("hints.depositMinimum")}</p>
    </section>
  );
}

function InvoiceSection({ form }: SectionProps) {
  const t = useTranslations("paymentSettings");
  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-base">{t("invoice.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("invoice.description")}</p>
      </div>
      <InvoiceProviderField form={form} />
    </section>
  );
}

export type PaymentSettingsFormProps = { settings: PaymentSettingsDto; canEdit: boolean };

/** The deposit rule and the invoice provider (`paymentSettings.update`, ADR 0090). */
export function PaymentSettingsForm({ settings, canEdit }: PaymentSettingsFormProps) {
  const t = useTranslations("paymentSettings");
  const { form, submit, pending } = usePaymentSettingsForm({ settings });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-8">
        <fieldset disabled={!canEdit} className="grid gap-8">
          <DepositSection form={form} />
          <InvoiceSection form={form} />
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending}>
              {t("save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
        )}
      </form>
    </Form>
  );
}
