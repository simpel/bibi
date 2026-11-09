"use client";

import type { InvoiceProvider, PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { AutoSaveSelect } from "@/components/form/auto-save-select";
import { updatePaymentSettingsAction } from "../actions";

// Replaced by one routing row per method in a later phase (ADR 0100).
const CHOICES = ["AUTO", "STRIPE", "FORTNOX"] as const;

export type InvoiceProviderSelectProps = {
  value: InvoiceProvider | null;
  canEdit: boolean;
  onSaved?: ((input: { value: PaymentSettingsDto }) => void) | undefined;
};

/** Which connected system raises invoices, saved on change (`paymentSettings.update`, ADR 0090). */
export function InvoiceProviderSelect({ value, canEdit, onSaved }: InvoiceProviderSelectProps) {
  const t = useTranslations("paymentSettings");
  return (
    <AutoSaveSelect
      label={t("fields.invoiceProvider")}
      value={CHOICES.find((choice) => choice === value) ?? "AUTO"}
      options={CHOICES.map((choice) => ({ value: choice, label: t(`provider.${choice}`) }))}
      canEdit={canEdit}
      hint={t("hints.invoiceProvider")}
      save={({ value: choice }) =>
        updatePaymentSettingsAction({
          input: { invoiceProvider: choice === "AUTO" ? null : choice },
        })
      }
      saved={t("saved")}
      onSaved={onSaved}
    />
  );
}
