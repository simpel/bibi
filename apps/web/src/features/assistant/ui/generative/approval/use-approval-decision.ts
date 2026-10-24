"use client";

import type { Approval } from "@bibi/ai";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { type ApprovalErrorKey, approvalErrorKey } from "../../../lib/approval-error";
import type { StoredDecision } from "../../../lib/stored-messages";
import { type Decision, postDecision } from "./post-decision";

export type DecisionState =
  | { status: "idle" }
  | { status: "pending"; decision: Decision }
  | { status: "approved"; result: unknown }
  | { status: "rejected" }
  /** `final`: the proposal is spent or expired, so the buttons stay disabled. */
  | { status: "error"; errorKey: ApprovalErrorKey; final: boolean };

export type UseApprovalDecisionInput = {
  approval: Pick<Approval, "approvalToken" | "operation">;
  toolCallId: string | undefined;
  conversationId: string | null;
  stored: StoredDecision | undefined;
  /** Runs once, right after the user's approval went through (not for a stored decision). */
  onApproved?: () => void;
};

const fromStored = ({ stored }: { stored: StoredDecision | undefined }): DecisionState => {
  if (!stored) return { status: "idle" };
  if (stored.decision === "rejected") return { status: "rejected" };
  if (stored.decision === "failed") return { status: "error", errorKey: "generic", final: true };
  return { status: "approved", result: stored.result };
};

/** Approve/reject state machine for one card. After an approval the server data is refreshed. */
export function useApprovalDecision({
  approval,
  toolCallId,
  conversationId,
  stored,
  onApproved,
}: UseApprovalDecisionInput) {
  const t = useTranslations("assistant.approval");
  const router = useRouter();
  const [state, setState] = useState<DecisionState>(() => fromStored({ stored }));

  const decide = async ({ decision }: { decision: Decision }) => {
    setState({ status: "pending", decision });
    const outcome = await postDecision({
      decision,
      approvalToken: approval.approvalToken,
      operation: approval.operation,
      conversationId,
      toolCallId,
    });
    if (!outcome.ok) {
      const final = outcome.status === 409 || outcome.status === 403;
      setState({ status: "error", errorKey: approvalErrorKey({ status: outcome.status }), final });
    } else if (outcome.status === "rejected") {
      setState({ status: "rejected" });
    } else {
      setState({ status: "approved", result: outcome.result });
      toast.success(t("approvedToast"));
      router.refresh();
      onApproved?.();
    }
  };
  return { state, decide };
}
