"use client";

import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { formatCountdown } from "../../../lib/format-countdown";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalStatusProps = { state: DecisionState; seconds: number };

/** Outcome badge once decided; otherwise the time left to decide (proposals live 10 minutes). */
export function ApprovalStatus({ state, seconds }: ApprovalStatusProps) {
  const t = useTranslations("assistant.approval");
  if (state.phase === "approved") return <Badge variant="success">{t("approved")}</Badge>;
  if (state.phase === "rejected") return <Badge variant="secondary">{t("rejected")}</Badge>;
  if (seconds === 0) return <Badge variant="warning">{t("expired")}</Badge>;
  return (
    <span className="text-xs text-muted-foreground" aria-live="off">
      {t("expiresIn", { time: formatCountdown({ seconds }) })}
    </span>
  );
}
