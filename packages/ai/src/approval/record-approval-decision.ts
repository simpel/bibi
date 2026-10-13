import { appendMessage, type EmbedFn, type MessageDto, type Result } from "@okazi/core";
import { runCore } from "../server/run-core";
import type { UserContext } from "../server/resolve-user";

export type ApprovalDecision = "approved" | "rejected" | "failed";

/** Data part stored with the note; the web can render it, the model sees the text part. */
export const APPROVAL_DATA_PART = "data-okazi-approval";

const MAX_RESULT_CHARS = 4000;

export type RecordApprovalDecisionInput = {
  user: UserContext;
  embed: EmbedFn;
  conversationId: string;
  toolCallId?: string;
  operation?: string;
  decision: ApprovalDecision;
  /** Operation output (approved) or error message (failed). */
  detail?: unknown;
};

type NoteTextInput = Pick<RecordApprovalDecisionInput, "decision" | "operation" | "detail">;

const noteText = ({ decision, operation, detail }: NoteTextInput): string => {
  const what = operation ?? "the proposed action";
  const head = `Approval update: the user ${decision === "rejected" ? "REJECTED" : "APPROVED"} ${what}.`;
  if (decision === "rejected") return `${head} Nothing was executed.`;
  const json = JSON.stringify(detail ?? null).slice(0, MAX_RESULT_CHARS);
  return decision === "failed" ? `${head} Execution failed: ${json}` : `${head} Result: ${json}`;
};

/**
 * TOOL message in the conversation, appended *as the user* (who made the decision) through core,
 * so the next model turn knows what happened and the history shows it.
 */
export function recordApprovalDecision({
  user,
  embed,
  conversationId,
  toolCallId,
  operation,
  decision,
  detail,
}: RecordApprovalDecisionInput): Promise<Result<MessageDto>> {
  const data = { toolCallId: toolCallId ?? null, operation: operation ?? null, decision };
  const parts = [
    { type: "text", text: noteText({ decision, operation, detail }) },
    { type: APPROVAL_DATA_PART, data },
  ];
  return runCore({
    operation: appendMessage,
    input: { conversationId, role: "TOOL", parts, metadata: { kind: "approval" } },
    context: user,
    embed,
  });
}
