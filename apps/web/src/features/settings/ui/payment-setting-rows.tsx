"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { DepositEditor } from "@/features/payment-account/ui/deposit-editor";
import { InvoiceProviderSelect } from "@/features/payment-account/ui/invoice-provider-select";
import { PaymentOperatorSelect } from "@/features/payment-account/ui/payment-operator-select";
import type { SettingEditorProps } from "./setting-props";
import { SettingRow } from "./setting-row";

const savedPayment =
  ({ onSaved }: Pick<SettingEditorProps, "onSaved">) =>
  ({ value }: { value: PaymentSettingsDto }) =>
    onSaved({ patch: { payment: value } });

/** Who takes card payments (ADR 0090), saved on change. */
export function PaymentOperatorSettingRow({ view, onSaved }: SettingEditorProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingRow setting="paymentOperator" description={t("operator.description")}>
      <PaymentOperatorSelect
        value={view.payment.paymentOperator ?? "AUTO"}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingRow>
  );
}

/** The deposit rule (ADR 0090), its two fields and Save. */
export function DepositSettingRow({ view, onSaved }: SettingEditorProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingRow setting="deposit" description={t("deposit.description")}>
      <DepositEditor
        depositPercent={view.payment.depositPercent}
        depositMinimumMinor={view.payment.depositMinimumMinor}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingRow>
  );
}

/** Which connected system raises invoices (ADR 0090), saved on change. */
export function InvoicesSettingRow({ view, onSaved }: SettingEditorProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingRow setting="invoices" description={t("invoice.description")}>
      <InvoiceProviderSelect
        value={view.payment.invoiceProvider}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingRow>
  );
}
