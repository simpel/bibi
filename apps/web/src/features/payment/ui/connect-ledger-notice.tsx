import { Alert, AlertDescription, Button } from "@bibi/ui";
import { AlertCircleIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
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
    <Alert data-slot="connect-ledger-notice">
      <AlertCircleIcon className="size-4" />
      <div className="col-start-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AlertDescription className="text-foreground">
          {canConnect ? t("missing") : t("askAdmin")}
        </AlertDescription>
        {canConnect ? (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="shrink-0 self-start sm:self-center"
          >
            <Link href={ROUTES.adminIntegrations}>{t("connect")}</Link>
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
