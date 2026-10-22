import type { EmbedFn } from "@bibi/core";
import { ok, type Result } from "@bibi/core";
import type { UserContext } from "../server/resolve-user";
import { recordApprovalDecision } from "./record-approval-decision";

export type RejectApprovalInput = {
  user: UserContext;
  embed: EmbedFn;
  /** Without a conversation there is nothing to record: rejecting is just dropping the token. */
  conversationId?: string;
  toolCallId?: string;
  operation?: string;
};

/**
 * Rejecting needs no server call: the token is simply never confirmed and expires (10 min).
 * With a conversation id a TOOL note is stored so the model does not retry blindly.
 */
export async function rejectApproval({
  user,
  embed,
  conversationId,
  toolCallId,
  operation,
}: RejectApprovalInput): Promise<Result<{ recorded: boolean }>> {
  if (!conversationId) return ok({ value: { recorded: false } });
  const note = await recordApprovalDecision({
    user,
    embed,
    conversationId,
    decision: "rejected",
    ...(toolCallId ? { toolCallId } : {}),
    ...(operation ? { operation } : {}),
  });
  return note.ok ? ok({ value: { recorded: true } }) : note;
}
