import type { BillingAccessState } from "@bibi/core/schemas";
import { StatusBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";

const COLOR: Record<BillingAccessState, string> = {
  EXEMPT: "var(--muted-foreground)",
  UNCONFIGURED: "var(--muted-foreground)",
  TRIAL: "var(--warning)",
  ACTIVE: "var(--success)",
  PAST_DUE: "var(--warning)",
  REQUIRED: "var(--destructive)",
};

export type BillingStateBadgeProps = { state: BillingAccessState };

/** Whether the organization may use Bibi (ADR 0095 §5), in words. */
export function BillingStateBadge({ state }: BillingStateBadgeProps) {
  const t = useTranslations("billing.state");
  return <StatusBadge label={t(state)} color={COLOR[state]} />;
}
