import type { BillingAccessState } from "@bibi/core/schemas";
import { Badge, type BadgeProps } from "@bibi/ui";
import { useTranslations } from "next-intl";

const VARIANT: Record<BillingAccessState, BadgeProps["variant"]> = {
  EXEMPT: "secondary",
  UNCONFIGURED: "outline",
  TRIAL: "secondary",
  ACTIVE: "success",
  PAST_DUE: "warning",
  REQUIRED: "destructive",
};

export type BillingStateBadgeProps = { state: BillingAccessState };

/** Whether the organization may use Bibi (ADR 0095 §5), in words. */
export function BillingStateBadge({ state }: BillingStateBadgeProps) {
  const t = useTranslations("billing.state");
  return <Badge variant={VARIANT[state]}>{t(state)}</Badge>;
}
