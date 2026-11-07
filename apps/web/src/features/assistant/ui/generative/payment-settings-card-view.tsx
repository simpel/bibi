"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCan } from "@/components/shell/permissions-context";
import { InvoiceProviderField } from "@/features/payment-account/ui/invoice-provider-field";
import { PaymentOperatorSelect } from "@/features/payment-account/ui/payment-operator-select";
import { DepositFields } from "@/features/payment-account/ui/payment-settings-form";
import { usePaymentSettingsForm } from "@/features/payment-account/ui/use-payment-settings-form";
import { ROUTES } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";
import { SettingRow, SettingsCard } from "./settings-card";

type RulesFormProps = {
  settings: PaymentSettingsDto;
  canEdit: boolean;
  onSaved: (input: { value: PaymentSettingsDto }) => void;
};

/** The deposit rule and the invoice provider: one form and one Save, as on the Payments page. */
function PaymentRulesForm({ settings, canEdit, onSaved }: RulesFormProps) {
  const t = useTranslations("paymentSettings");
  const { form, submit, pending } = usePaymentSettingsForm({ settings, onSaved });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="contents">
        <SettingRow section="deposit" description={t("deposit.description")}>
          <DepositFields form={form} canEdit={canEdit} />
        </SettingRow>
        <SettingRow section="invoices" description={t("invoice.description")}>
          <fieldset disabled={!canEdit} className="grid gap-4">
            <InvoiceProviderField form={form} />
          </fieldset>
          {canEdit ? (
            <div>
              <Button type="submit" disabled={pending}>
                {t("save")}
              </Button>
            </div>
          ) : null}
        </SettingRow>
      </form>
    </Form>
  );
}

export type PaymentSettingsCardViewProps = GenerativeProps<"payment-settings-card">;

/** The Payments page's settings in the chat: operator, deposit and invoices, editable in place. */
export function PaymentSettingsCardView({ settings }: PaymentSettingsCardViewProps) {
  const nav = useTranslations("nav");
  const t = useTranslations("paymentSettings");
  const [current, setCurrent] = useState(settings);
  const canEdit = useCan({ permission: "paymentAccount:write" });
  const onSaved = ({ value }: { value: PaymentSettingsDto }) => setCurrent(value);
  return (
    <SettingsCard slot="payment-settings-card" title={nav("payments")} href={ROUTES.adminPayments}>
      <SettingRow section="paymentOperator" description={t("operator.description")}>
        <PaymentOperatorSelect
          label={t("operator.label")}
          value={current.paymentOperator ?? "AUTO"}
          canEdit={canEdit}
          options={[
            { value: "AUTO", label: t("provider.AUTO") },
            { value: "STRIPE", label: t("provider.STRIPE") },
          ]}
          onSaved={onSaved}
        />
      </SettingRow>
      <PaymentRulesForm settings={current} canEdit={canEdit} onSaved={onSaved} />
    </SettingsCard>
  );
}
