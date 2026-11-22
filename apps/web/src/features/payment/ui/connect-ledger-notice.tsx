import { getTranslations } from "next-intl/server";
import { SetupNotice } from "@/components/states/setup-notice";
import { ROUTES } from "@/lib/routes";

export type ConnectLedgerNoticeProps = {
  /** May connect integrations (`integration:write`): shows the way there, else who to ask. */
  canConnect: boolean;
};

/**
 * In place of the payment actions while no accounting system is connected (ADR 0106): Fortnox or
 * Visma issues every invoice and prepayment invoice, so nothing can be requested before.
 */
export async function ConnectLedgerNotice({ canConnect }: ConnectLedgerNoticeProps) {
  const t = await getTranslations("payment.ledger");
  return (
    <SetupNotice
      slot="connect-ledger-notice"
      action={canConnect ? { href: ROUTES.adminIntegrations, label: t("connect") } : undefined}
    >
      {canConnect ? t("missing") : t("askAdmin")}
    </SetupNotice>
  );
}
