"use client";

import type { IntegrationProvider, PaymentSettingsDto } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { AdminSection } from "@/components/admin/admin-section";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { DepositEditor } from "./deposit-editor";
import { PaymentRoutesEditor } from "./payment-routes-editor";

export type PaymentSettingsFormProps = {
  settings: PaymentSettingsDto;
  connected: readonly IntegrationProvider[] | null;
  canEdit: boolean;
  showRoutes: boolean;
  showDeposit: boolean;
};

/**
 * The payment methods' routes and the deposit rule (`paymentSettings.update`, ADR 0090, 0100),
 * one section each with its own editor, the same editors the assistant's setting cards use.
 */
export function PaymentSettingsForm({
  settings,
  connected,
  canEdit,
  showRoutes,
  showDeposit,
}: PaymentSettingsFormProps) {
  const t = useTranslations("paymentSettings");
  return (
    <>
      {showRoutes ? (
        <AdminSection section="paymentMethods" description={t("routes.description")}>
          <div className="grid gap-3">
            <PaymentRoutesEditor settings={settings} connected={connected} canEdit={canEdit} />
            <Link
              href={`${ROUTES.adminIntegrations}#providers`}
              className="w-fit text-sm text-primary hover:underline"
            >
              {t("routes.manage")}
            </Link>
          </div>
        </AdminSection>
      ) : null}
      {showDeposit ? (
        <AdminSection section="deposit" description={t("deposit.description")}>
          <DepositEditor
            depositPercent={settings.depositPercent}
            depositMinimumMinor={settings.depositMinimumMinor}
            canEdit={canEdit}
          />
        </AdminSection>
      ) : null}
    </>
  );
}
