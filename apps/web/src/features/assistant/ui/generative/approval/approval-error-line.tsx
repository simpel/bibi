"use client";

import { useTranslations } from "next-intl";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalErrorLineProps = { state: DecisionState };

/** Localized failure of the last attempt (409 already used, 403 expired, network, ...). */
export function ApprovalErrorLine({ state }: ApprovalErrorLineProps) {
  const t = useTranslations("errors");
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {t(state.errorKey)}
    </p>
  );
}
