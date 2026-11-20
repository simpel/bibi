"use client";

import { Card } from "@bibi/ui";
import { useState } from "react";
import type { ApprovalEdits } from "../../lib/approval-edits";
import { useApprovalContext } from "../../state/approval-context";
import { ApprovalBody } from "./approval/approval-body";
import { ApprovalDone } from "./approval/approval-done";
import { ApprovalFooter } from "./approval/approval-footer";
import { ApprovalHeader } from "./approval/approval-header";
import { useApprovalDecision } from "./approval/use-approval-decision";
import { useCountdown } from "./approval/use-countdown";
import type { GenerativeProps } from "./generative-props";

export type ApprovalCardViewProps = GenerativeProps<"approval-card">;

/**
 * A mutation the assistant proposed. Nothing has run yet: the user approves (POST to
 * `/api/assistant/approval`, which executes it as the user) or rejects. Before confirming, the
 * user may edit the values with the pen on each row. Decided cards are locked.
 */
export function ApprovalCardView(props: ApprovalCardViewProps) {
  return <OperationApprovalCard {...props} />;
}

/** Confirm waits for "I understand" when the preview has a warning (ADR 0049). */
function useWarningGate({ preview }: { preview: ApprovalCardViewProps["approval"]["preview"] }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const warned = preview?.consequences.some((item) => item.severity === "warning") ?? false;
  return { acknowledged, setAcknowledged, blocked: warned && !acknowledged };
}

function OperationApprovalCard({ approval, toolCallId }: ApprovalCardViewProps) {
  const { conversationId, decisions } = useApprovalContext();
  const stored = decisions.find((decision) => decision.toolCallId === toolCallId);
  const [edits, setEdits] = useState<ApprovalEdits>({});
  const { state, decide } = useApprovalDecision({
    approval,
    toolCallId,
    conversationId,
    stored,
    edits,
  });
  const decided = state.status === "approved" || state.status === "rejected";
  const seconds = useCountdown({ expiresAt: approval.expiresAt, active: !decided });
  const { preview } = approval;
  const gate = useWarningGate({ preview });
  if (state.status === "approved") return <ApprovalDone preview={preview} result={state.result} />;
  return (
    <Card
      data-slot="approval-card"
      data-state={state.status}
      className="border-primary/40 shadow-none"
    >
      <ApprovalHeader
        summary={approval.summary}
        needsAdmin={preview?.group === "setup" || preview?.group === "organization"}
      />
      <ApprovalBody
        approval={approval}
        state={state}
        decided={decided}
        acknowledged={gate.acknowledged}
        onAcknowledge={({ acknowledged }) => gate.setAcknowledged(acknowledged)}
        edits={edits}
        onEdit={({ path, value }) => setEdits((current) => ({ ...current, [path]: value }))}
      />
      <ApprovalFooter
        state={state}
        seconds={seconds}
        decided={decided}
        blocked={gate.blocked}
        onDecide={decide}
      />
    </Card>
  );
}
