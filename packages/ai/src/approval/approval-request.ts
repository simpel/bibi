import { z } from "zod";

/** Body of `POST` to the approval endpoint (the web approval card). */
export const ApprovalRequestSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  approvalToken: z.string().min(1).max(20_000),
  /** Conversation the proposal came from; the decision is stored there as a TOOL message. */
  conversationId: z.string().min(1).max(200).optional(),
  toolCallId: z.string().min(1).max(200).optional(),
  /** Display only (note text); the token alone decides what runs. */
  operation: z.string().min(1).max(100).optional(),
});

export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

/** Success body. `result` = the operation output (e.g. the created venue). */
export type ApprovalResponse =
  | { status: "approved"; result: Record<string, unknown> }
  | { status: "rejected" };
