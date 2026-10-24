"use client";

import { Button } from "@bibi/ui";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Decision } from "./post-decision";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalActionsProps = {
  state: DecisionState;
  expired: boolean;
  /** Confirm stays disabled until the user acknowledged the warnings (ADR 0049). */
  blocked?: boolean;
  onDecide: (input: { decision: Decision }) => void;
};

const isLocked = ({ state }: { state: DecisionState }): boolean =>
  state.status === "pending" ||
  state.status === "approved" ||
  state.status === "rejected" ||
  (state.status === "error" && state.final);

/** Cancel / Confirm; both are disabled while sending and after a final decision. */
export function ApprovalActions({
  state,
  expired,
  blocked = false,
  onDecide,
}: ApprovalActionsProps) {
  const t = useTranslations("assistant.approval");
  const locked = isLocked({ state });
  const pending = state.status === "pending";
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={locked}
        onClick={() => onDecide({ decision: "reject" })}
      >
        <XIcon />
        {t("reject")}
      </Button>
      <Button
        size="sm"
        disabled={locked || expired || blocked}
        onClick={() => onDecide({ decision: "approve" })}
      >
        <CheckIcon />
        {pending && state.decision === "approve" ? t("approving") : t("approve")}
      </Button>
    </div>
  );
}
