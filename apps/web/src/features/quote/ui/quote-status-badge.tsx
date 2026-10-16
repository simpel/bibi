import type { QuoteStatus } from "@okazi/core/schemas";
import { Badge, type BadgeProps } from "@okazi/ui";
import { useTranslations } from "next-intl";

const VARIANT: Record<QuoteStatus, BadgeProps["variant"]> = {
  DRAFT: "secondary",
  SENT: "warning",
  ACCEPTED: "success",
  DECLINED: "destructive",
  EXPIRED: "outline",
};

export type QuoteStatusBadgeProps = { status: QuoteStatus };

/** The quote's fixed status (ADR 0022) as a colored badge. */
export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const t = useTranslations("quote.statuses");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
