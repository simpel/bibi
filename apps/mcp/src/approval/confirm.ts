import {
  type AfterCommitHook,
  type AnyOperation,
  appError,
  type ExecuteContext,
  err,
  execute,
  type Result,
} from "@bibi/core";
import { type ApprovalEdits, applyEdits } from "./apply-edits";
import { consumeApproval } from "./consumed";
import { verifyApprovalToken } from "./verify";

export type ConfirmApprovalInput = {
  token: string;
  /** Fields the user changed on the card before confirming. */
  edits?: ApprovalEdits;
  context: ExecuteContext;
  operations: readonly AnyOperation[];
  afterCommit: readonly AfterCommitHook[];
  secret: string;
};

type FailInput = { code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT"; message: string };

const fail = ({ code, message }: FailInput) => err({ error: appError({ code, message }) });

/**
 * Verifies the token and runs the approved command, with any fields the user edited on the card. The caller must be the human user (not the AI
 * actor). Execution uses the `ai` actor + conversation id so the audit row says `AI`, with
 * `actorId` = the user the AI acted for and `approvedBy` = the user who confirmed (same person:
 * the token is bound to that user).
 */
export async function confirmApproval({
  token,
  edits,
  context,
  operations,
  afterCommit,
  secret,
}: ConfirmApprovalInput): Promise<Result<unknown>> {
  const { actor } = context;
  if (actor.type !== "user" || !actor.userId) {
    return fail({
      code: "FORBIDDEN",
      message: "Approvals must be confirmed by the user, not the assistant",
    });
  }
  const verified = verifyApprovalToken({
    token,
    secret,
    organizationId: context.organizationId,
    userId: actor.userId,
  });
  if (!verified.ok) return verified;
  const { jti, exp, operation: name, input, conversationId } = verified.value;
  const operation = operations.find((candidate) => candidate.name === name);
  if (!operation) return fail({ code: "NOT_FOUND", message: `Unknown operation ${name}` });
  // Validated before the token is spent, so a bad edit can be fixed and confirmed again.
  const edited = applyEdits({ operation, input, edits });
  if (!edited.ok) return edited;
  if (!consumeApproval({ jti, exp }))
    return fail({ code: "CONFLICT", message: "Approval already used" });
  const aiActor = {
    type: "ai" as const,
    userId: actor.userId,
    approvedBy: actor.userId,
    ...(conversationId ? { conversationId } : {}),
  };
  return execute({
    operation,
    input: edited.value,
    context: { ...context, actor: aiActor },
    afterCommit,
  });
}
