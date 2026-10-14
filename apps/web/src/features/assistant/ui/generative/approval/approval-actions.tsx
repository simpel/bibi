"use client";

import { Button } from "@okazi/ui";
import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Decision } from "./post-decision";
import type { DecisionState } from "./use-approval-decision";

export type ApprovalActionsProps = {
  state: DecisionState;
  expired: boolean;
  onDecide: (input: { decision: Decision }) => void;
};

const isLocked = ({ state }: { state: DecisionState }): boolean =>
  state.phase === "pending" ||
  state.phase === "approved" ||
  state.phase === "rejected" ||
  (state.phase === "error" && state.final);

/** Reject / Approve; both are disabled while sending and after a final decision. */
export function ApprovalActions({ state, expired, onDecide }: ApprovalActionsProps) {
  const t = useTranslations("assistant.approval");
  const locked = isLocked({ state });
  const pending = state.phase === "pending";
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
        disabled={locked || expired}
        onClick={() => onDecide({ decision: "approve" })}
      >
        <CheckIcon />
        {pending && state.decision === "approve" ? t("approving") : t("approve")}
      </Button>
    </div>
  );
}
