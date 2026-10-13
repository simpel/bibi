import {
  type AfterCommitHook,
  type AnyOperation,
  appError,
  type ExecuteContext,
  err,
  execute,
  type Result,
} from "@okazi/core";
import { consumeApproval } from "./consumed";
import { verifyApprovalToken } from "./verify";

export type ConfirmApprovalInput = {
  token: string;
  context: ExecuteContext;
  operations: readonly AnyOperation[];
  afterCommit: readonly AfterCommitHook[];
  secret: string;
};

type FailInput = { code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT"; message: string };

const fail = ({ code, message }: FailInput) => err({ error: appError({ code, message }) });

/**
 * Verifies the token and runs the approved command. The caller must be the human user (not the AI
 * actor). Execution uses the `ai` actor + conversation id so the audit row says `AI`, while
 * `actorId` is the approving user. Core has no separate `approvedBy` column.
 */
export async function confirmApproval({
  token,
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
  if (!consumeApproval({ jti, exp }))
    return fail({ code: "CONFLICT", message: "Approval already used" });
  const aiActor = { type: "ai" as const, userId: actor.userId, conversationId };
  return execute({ operation, input, context: { ...context, actor: aiActor }, afterCommit });
}
