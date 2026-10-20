"use client";

import { Card } from "@okazi/ui";
import { useState } from "react";
import { useApprovalContext } from "../../state/approval-context";
import { ApprovalBody } from "./approval/approval-body";
import { ApprovalFooter } from "./approval/approval-footer";
import { ApprovalHeader } from "./approval/approval-header";
import { useApprovalDecision } from "./approval/use-approval-decision";
import { useCountdown } from "./approval/use-countdown";
import type { GenerativeProps } from "./generative-props";
import { SetupApprovalCardView } from "./setup-approval-card-view";

const SETUP_OPERATION = "pipelineSetup.activate";

export type ApprovalCardViewProps = GenerativeProps<"approval-card">;

/**
 * A mutation the assistant proposed. Nothing has run yet: the user approves (POST to
 * `/api/assistant/approval`, which executes it as the user) or rejects. Decided cards are locked.
 */
export function ApprovalCardView(props: ApprovalCardViewProps) {
  if (props.approval.operation === SETUP_OPERATION) return <SetupApprovalCardView {...props} />;
  return <OperationApprovalCard {...props} />;
}

/** Confirm waits for "I understand" when the preview has a warning (ADR 0049). */
function useWarningGate({ preview }: { preview: ApprovalCardViewProps["approval"]["preview"] }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const warned = preview?.consequences.some((item) => item.severity === "warning") ?? false;
  return { acknowledged, setAcknowledged, blocked: warned && !acknowledged };
}

function OperationApprovalCard({ approval, toolCallId, toolName }: ApprovalCardViewProps) {
  const { conversationId, decisions } = useApprovalContext();
  const stored = decisions.find((decision) => decision.toolCallId === toolCallId);
  const { state, decide } = useApprovalDecision({ approval, toolCallId, conversationId, stored });
  const decided = state.phase === "approved" || state.phase === "rejected";
  const seconds = useCountdown({ expiresAt: approval.expiresAt, active: !decided });
  const { preview } = approval;
  const gate = useWarningGate({ preview });
  return (
    <Card
      data-slot="approval-card"
      data-state={state.phase}
      className="border-primary/40 shadow-none"
    >
      <ApprovalHeader
        operation={approval.operation}
        summary={approval.summary}
        needsAdmin={preview?.group === "setup" || preview?.group === "organization"}
      />
      <ApprovalBody
        approval={approval}
        toolName={toolName}
        state={state}
        decided={decided}
        acknowledged={gate.acknowledged}
        onAcknowledge={({ acknowledged }) => gate.setAcknowledged(acknowledged)}
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
