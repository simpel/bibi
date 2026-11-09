"use client";

import type { PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { DepositEditor } from "./deposit-editor";
import { InvoiceProviderSelect } from "./invoice-provider-select";

export type PaymentSettingsFormProps = {
  settings: PaymentSettingsDto;
  canEdit: boolean;
  showDeposit: boolean;
  showInvoices: boolean;
};

/**
 * The deposit rule and the invoice provider (`paymentSettings.update`, ADR 0090), one section
 * each with its own editor, the same editors the assistant's setting cards use.
 */
export function PaymentSettingsForm({
  settings,
  canEdit,
  showDeposit,
  showInvoices,
}: PaymentSettingsFormProps) {
  const t = useTranslations("paymentSettings");
  return (
    <>
      {showDeposit ? (
        <AdminSection section="deposit" description={t("deposit.description")}>
          <DepositEditor
            depositPercent={settings.depositPercent}
            depositMinimumMinor={settings.depositMinimumMinor}
            canEdit={canEdit}
          />
        </AdminSection>
      ) : null}
      {showInvoices ? (
        <AdminSection section="invoices" description={t("invoice.description")}>
          <InvoiceProviderSelect value={settings.invoiceProvider} canEdit={canEdit} />
        </AdminSection>
      ) : null}
    </>
  );
}
