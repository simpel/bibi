import { z } from "zod";

/** `structuredContent` of an MCP command the AI actor proposed (apps/mcp approval flow). */
export const ApprovalRequiredSchema = z.object({
  status: z.literal("approval_required"),
  operation: z.string().min(1),
  input: z.unknown(),
  summary: z.string(),
  approvalToken: z.string().min(1),
  expiresAt: z.iso.datetime({ offset: true }),
});

export type ApprovalRequired = z.infer<typeof ApprovalRequiredSchema>;

/** A pending approval as the web approval card receives it. */
export type Approval = {
  /** Tool call in the assistant message the card belongs to. */
  toolCallId: string;
  /** MCP tool the model called, e.g. `venue_create`. */
  toolName: string;
  /** Core operation, e.g. `venue.create`. */
  operation: string;
  input: unknown;
  /** Human-readable proposal, e.g. `Create venue "Aulan"`. */
  summary: string;
  /** Opaque; send back unchanged to the approval endpoint. Valid 10 minutes, single use. */
  approvalToken: string;
  expiresAt: string;
};

const McpOutputSchema = z.looseObject({ structuredContent: z.unknown() });

export type ReadApprovalInput = { output: unknown };

/** Approval proposal in a tool output (MCP `CallToolResult` or bare structured content). */
export function readApproval({ output }: ReadApprovalInput): ApprovalRequired | null {
  const wrapped = McpOutputSchema.safeParse(output);
  const isWrapped = wrapped.success && "structuredContent" in wrapped.data;
  const content = isWrapped ? wrapped.data.structuredContent : output;
  const parsed = ApprovalRequiredSchema.safeParse(content);
  return parsed.success ? parsed.data : null;
}
