"use client";

import { Card, CardContent, CardFooter } from "@okazi/ui";
import { useApprovalContext } from "../../state/approval-context";
import { ApprovalActions } from "./approval/approval-actions";
import { ApprovalErrorLine } from "./approval/approval-error-line";
import { ApprovalHeader } from "./approval/approval-header";
import { ApprovalStatus } from "./approval/approval-status";
import { InputList } from "./approval/input-list";
import { useApprovalDecision } from "./approval/use-approval-decision";
import { useCountdown } from "./approval/use-countdown";
import type { GenerativeProps } from "./generative-props";
import { SetupApprovalCardView } from "./setup-approval-card-view";
import { ToolResultView } from "./tool-result-view";

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

function OperationApprovalCard({ approval, toolCallId, toolName }: ApprovalCardViewProps) {
  const { conversationId, decisions } = useApprovalContext();
  const stored = decisions.find((decision) => decision.toolCallId === toolCallId);
  const { state, decide } = useApprovalDecision({ approval, toolCallId, conversationId, stored });
  const decided = state.phase === "approved" || state.phase === "rejected";
  const seconds = useCountdown({ expiresAt: approval.expiresAt, active: !decided });
  return (
    <Card
      data-slot="approval-card"
      data-state={state.phase}
      className="border-primary/40 shadow-none"
    >
      <ApprovalHeader operation={approval.operation} summary={approval.summary} />
      <CardContent className="grid gap-3 p-4 pt-0">
        <InputList input={approval.input} />
        <ApprovalErrorLine state={state} />
        {state.phase === "approved" && state.result ? (
          <ToolResultView
            toolName={toolName ?? approval.operation.replaceAll(".", "_")}
            output={state.result}
          />
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-2 p-4 pt-0">
        <ApprovalStatus state={state} seconds={seconds} />
        {decided ? null : (
          <ApprovalActions state={state} expired={seconds === 0} onDecide={decide} />
        )}
      </CardFooter>
    </Card>
  );
}
