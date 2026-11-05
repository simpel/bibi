import type { QuoteStatus } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

const COLOR: Record<QuoteStatus, string> = {
  DRAFT: "var(--muted-foreground)",
  SENT: "var(--warning)",
  ACCEPTED: "var(--success)",
  DECLINED: "var(--destructive)",
  EXPIRED: "var(--muted-foreground)",
};

export type QuoteStatusBadgeProps = { status: QuoteStatus };

/** The quote's fixed status (ADR 0022) as a colored badge. */
export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const t = useTranslations("quote.statuses");
  return <StatusBadge label={t(status)} color={COLOR[status]} />;
}
