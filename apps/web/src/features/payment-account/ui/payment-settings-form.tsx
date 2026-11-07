"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { AdminSection } from "@/components/admin/admin-section";
import { TextField } from "@/components/form/text-field";
import { InvoiceProviderField } from "./invoice-provider-field";
import {
  type PaymentSettingsFormOutput,
  type PaymentSettingsFormValues,
  usePaymentSettingsForm,
} from "./use-payment-settings-form";

const FORM_ID = "payment-settings";

type SectionProps = {
  form: UseFormReturn<PaymentSettingsFormValues, unknown, PaymentSettingsFormOutput>;
  canEdit: boolean;
  /** The last section shown holds the one Save button. */
  save: boolean;
  pending: boolean;
};

function SaveRow({ canEdit, pending }: Pick<SectionProps, "canEdit" | "pending">) {
  const t = useTranslations("paymentSettings");
  if (!canEdit) return <p className="text-sm text-muted-foreground">{t("readOnly")}</p>;
  return (
    <div>
      <Button type="submit" form={FORM_ID} disabled={pending}>
        {t("save")}
      </Button>
    </div>
  );
}

function DepositSection({ form, canEdit, save, pending }: SectionProps) {
  const t = useTranslations("paymentSettings");
  return (
    <AdminSection id="deposit" title={t("deposit.title")} description={t("deposit.description")}>
      <fieldset disabled={!canEdit} className="grid max-w-lg gap-4">
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
      </fieldset>
      {save ? <SaveRow canEdit={canEdit} pending={pending} /> : null}
    </AdminSection>
  );
}

function InvoiceSection({ form, canEdit, save, pending }: SectionProps) {
  const t = useTranslations("paymentSettings");
  return (
    <AdminSection id="invoices" title={t("invoice.title")} description={t("invoice.description")}>
      <fieldset disabled={!canEdit} className="grid gap-4">
        <InvoiceProviderField form={form} />
      </fieldset>
      {save ? <SaveRow canEdit={canEdit} pending={pending} /> : null}
    </AdminSection>
  );
}

export type PaymentSettingsFormProps = {
  settings: PaymentSettingsDto;
  canEdit: boolean;
  showDeposit: boolean;
  showInvoices: boolean;
};

/**
 * The deposit rule and the invoice provider (`paymentSettings.update`, ADR 0090): one form, one
 * Save. The sections stay direct children of the page so their bands alternate, so the form
 * element sits after them, empty, and the controls and the Save button belong to it by its id.
 */
export function PaymentSettingsForm({
  settings,
  canEdit,
  showDeposit,
  showInvoices,
}: PaymentSettingsFormProps) {
  const { form, submit, pending } = usePaymentSettingsForm({ settings });
  return (
    <Form {...form}>
      {showDeposit ? (
        <DepositSection form={form} canEdit={canEdit} save={!showInvoices} pending={pending} />
      ) : null}
      {showInvoices ? (
        <InvoiceSection form={form} canEdit={canEdit} save pending={pending} />
      ) : null}
      <form id={FORM_ID} onSubmit={submit} noValidate />
    </Form>
  );
}
