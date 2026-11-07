"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { DepositEditor } from "@/features/payment-account/ui/deposit-editor";
import { InvoiceProviderSelect } from "@/features/payment-account/ui/invoice-provider-select";
import { PaymentOperatorSelect } from "@/features/payment-account/ui/payment-operator-select";
import { SettingCard } from "./setting-card";
import type { SettingCardProps } from "./setting-props";

const savedPayment =
  ({ onSaved }: Pick<SettingCardProps, "onSaved">) =>
  ({ value }: { value: PaymentSettingsDto }) =>
    onSaved({ patch: { payment: value } });

/** Who takes card payments (ADR 0090), saved on change. */
export function PaymentOperatorSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingCard setting="paymentOperator" description={t("operator.description")}>
      <PaymentOperatorSelect
        value={view.payment.paymentOperator ?? "AUTO"}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingCard>
  );
}

/** The deposit rule (ADR 0090), its two fields and Save. */
export function DepositSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingCard setting="deposit" description={t("deposit.description")}>
      <DepositEditor
        depositPercent={view.payment.depositPercent}
        depositMinimumMinor={view.payment.depositMinimumMinor}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingCard>
  );
}

/** Which connected system raises invoices (ADR 0090), saved on change. */
export function InvoicesSettingCard({ view, onSaved }: SettingCardProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingCard setting="invoices" description={t("invoice.description")}>
      <InvoiceProviderSelect
        value={view.payment.invoiceProvider}
        canEdit={canEdit}
        onSaved={savedPayment({ onSaved })}
      />
    </SettingCard>
  );
}
