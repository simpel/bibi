"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { useCan } from "@/components/shell/permissions-context";
import { DepositEditor } from "@/features/payment-account/ui/deposit-editor";
import { PaymentRoutesEditor } from "@/features/payment-account/ui/payment-routes-editor";
import type { SettingEditorProps } from "./setting-props";
import { SettingRow } from "./setting-row";

const savedPayment =
  ({ onSaved }: Pick<SettingEditorProps, "onSaved">) =>
  ({ value }: { value: PaymentSettingsDto }) =>
    onSaved({ patch: { payment: value } });

/** Which provider takes each payment method (ADR 0100), each saved on change. */
export function PaymentMethodsSettingRow({ view, onSaved }: SettingEditorProps) {
  const t = useTranslations("paymentSettings");
  const canEdit = useCan({ permission: "paymentAccount:write" });
  if (!view.payment) return null;
  return (
    <SettingRow setting="paymentMethods" description={t("routes.description")}>
      <PaymentRoutesEditor
        settings={view.payment}
        connected={null}
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
