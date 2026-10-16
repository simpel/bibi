import type { InquiryStatus } from "@okazi/core/schemas";
import { Badge, type BadgeProps } from "@okazi/ui";
import { useTranslations } from "next-intl";

const VARIANT: Record<InquiryStatus, BadgeProps["variant"]> = {
  NEW: "secondary",
  QUALIFIED: "default",
  QUOTED: "warning",
  WON: "success",
  LOST: "destructive",
};

export type InquiryStatusBadgeProps = { status: InquiryStatus };

/** The inquiry's fixed status (ADR 0022) as a colored badge. */
export function InquiryStatusBadge({ status }: InquiryStatusBadgeProps) {
  const t = useTranslations("inquiry.statuses");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
