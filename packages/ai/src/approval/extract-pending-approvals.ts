import { z } from "zod";
import { type Approval, readApproval } from "./approval-schema";

/** Tool part of an AI SDK `UIMessage`: `dynamic-tool` (MCP tools) or `tool-<name>` (local). */
const ToolPartSchema = z.looseObject({
  type: z.string(),
  toolCallId: z.string().min(1),
  toolName: z.string().optional(),
  state: z.literal("output-available"),
  output: z.unknown(),
});

export type ExtractPendingApprovalsInput = {
  /** A `UIMessage` (or the stored message DTO); only `parts` is read. */
  message: { parts: readonly unknown[] };
};

type ToolNameInput = { type: string; toolName: string | undefined };

const toolNameOf = ({ type, toolName }: ToolNameInput): string =>
  toolName ?? (type.startsWith("tool-") ? type.slice("tool-".length) : type);

/**
 * Pure: every tool result in the message that is an `approval_required` proposal, in order.
 * The web renders one approval card per entry; nothing has been executed for them yet.
 */
export function extractPendingApprovals({ message }: ExtractPendingApprovalsInput): Approval[] {
  const approvals: Approval[] = [];
  for (const raw of message.parts) {
    const part = ToolPartSchema.safeParse(raw);
    if (!part.success) continue;
    const approval = readApproval({ output: part.data.output });
    if (!approval) continue;
    const { operation, input, summary, approvalToken, expiresAt, preview } = approval;
    const toolName = toolNameOf({ type: part.data.type, toolName: part.data.toolName });
    const toolCallId = part.data.toolCallId;
    approvals.push({
      toolCallId,
      toolName,
      operation,
      input,
      summary,
      approvalToken,
      expiresAt,
      ...(preview ? { preview } : {}),
    });
  }
  return approvals;
}
