"use client";

import { useTranslations } from "next-intl";
import { formatCountdown } from "../../../lib/format-countdown";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalStatusProps = { state: DecisionState; seconds: number };

function Note({ children }: { children: string }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

/** The outcome as plain text once decided; otherwise the time left to decide (proposals live 10 minutes). */
export function ApprovalStatus({ state, seconds }: ApprovalStatusProps) {
  const t = useTranslations("assistant.approval");
  if (state.status === "approved") return <Note>{t("approved")}</Note>;
  if (state.status === "rejected") return <Note>{t("rejected")}</Note>;
  if (seconds === 0) return <Note>{t("expired")}</Note>;
  return (
    <span className="text-xs text-muted-foreground" aria-live="off">
      {t("expiresIn", { time: formatCountdown({ seconds }) })}
    </span>
  );
}
