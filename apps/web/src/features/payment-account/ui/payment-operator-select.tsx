"use client";

import type { PaymentOperator, PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { type AutoSaveOption, AutoSaveSelect } from "@/components/form/auto-save-select";
import { updatePaymentSettingsAction } from "../actions";

export type OperatorChoice = PaymentOperator | "AUTO";

export type PaymentOperatorSelectProps = {
  value: OperatorChoice;
  canEdit: boolean;
  /** Each choice's text, e.g. "Stripe (not connected)"; plain names when absent. */
  options?: AutoSaveOption<OperatorChoice>[] | undefined;
  onSaved?: ((input: { value: PaymentSettingsDto }) => void) | undefined;
};

/** The payment operator, saved as soon as it changes (`paymentSettings.update`, ADR 0090). */
export function PaymentOperatorSelect({
  value,
  canEdit,
  options,
  onSaved,
}: PaymentOperatorSelectProps) {
  const t = useTranslations("paymentSettings");
  return (
    <AutoSaveSelect
      label={t("operator.label")}
      value={value}
      options={
        options ?? [
          { value: "AUTO", label: t("provider.AUTO") },
          { value: "STRIPE", label: t("provider.STRIPE") },
        ]
      }
      canEdit={canEdit}
      save={({ value: choice }) =>
        updatePaymentSettingsAction({
          input: { paymentOperator: choice === "AUTO" ? null : choice },
        })
      }
      saved={t("saved")}
      onSaved={onSaved}
    />
  );
}
