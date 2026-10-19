import type { ReceivableProgress, ReceivableStatus } from "@okazi/core/schemas";
import { Badge } from "@okazi/ui";
import { useTranslations } from "next-intl";

export type ReceivableBadgesProps = { status?: ReceivableStatus; progress: ReceivableProgress };

/** A receivable's lifecycle (deposits and invoices) and its derived payment progress. */
export function ReceivableBadges({ status, progress }: ReceivableBadgesProps) {
  const t = useTranslations("payment");
  return (
    <>
      {status ? <Badge variant="outline">{t(`receivableStatus.${status}`)}</Badge> : null}
      {status === "VOID" ? null : (
        <Badge variant={progress === "PAID" ? "secondary" : "outline"}>
          {t(`progress.${progress}`)}
        </Badge>
      )}
    </>
  );
}
