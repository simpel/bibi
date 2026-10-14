import { getLogger } from "@okazi/logger";
import type { ApprovalRequest } from "./approval-request";

export type LogDecisionInput = { body: ApprovalRequest; status: number };

/** The human's answer to an AI proposal (ADR 0007/0014). The executed command logs separately. */
export function logDecision({ body, status }: LogDecisionInput): void {
  const ok = status < 400;
  const outcome = body.decision === "approve" ? (ok ? "approved" : "approveFailed") : "rejected";
  getLogger()[ok ? "info" : "warn"]({
    event: "approval.decided",
    decision: body.decision,
    outcome,
    status,
    operation: body.operation,
    conversationId: body.conversationId,
    toolCallId: body.toolCallId,
  });
}
