import { type AfterCommitHook, type AnyOperation, fromZodError } from "@bibi/core";
import { z } from "zod";
import { confirmApproval } from "../approval/confirm";
import { toJsonSchema } from "./json-schema";
import { errorResult, successResult } from "./results";
import type { McpTool, RunToolInput } from "./types";

export const ApprovalConfirmInputSchema = z.object({
  approvalToken: z.string().min(1).describe("Token from an approval_required result"),
});

export type ApprovalConfirmToolInput = {
  operations: readonly AnyOperation[];
  afterCommit: readonly AfterCommitHook[];
  secret: string;
};

/**
 * `approval_confirm`: executes a proposal the user approved. Called by the Bibi web app with the
 * user's own (non-AI) credentials; the assistant never sees or calls it.
 */
export function createApprovalConfirmTool({
  operations,
  afterCommit,
  secret,
}: ApprovalConfirmToolInput): McpTool {
  return {
    name: "approval_confirm",
    description:
      "Executes a command the user approved. Only the Bibi web app calls this, after the user " +
      "clicked Approve on an approval_required proposal. AI assistants must never call it.",
    inputSchema: toJsonSchema({ schema: ApprovalConfirmInputSchema, io: "input" }),
    outputSchema: { type: "object" },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    humanOnly: true,
    async run({ args, context }: RunToolInput) {
      const parsed = ApprovalConfirmInputSchema.safeParse(args);
      if (!parsed.success) {
        return errorResult({ error: fromZodError({ error: parsed.error }) });
      }
      const result = await confirmApproval({
        token: parsed.data.approvalToken,
        context,
        operations,
        afterCommit,
        secret,
      });
      return result.ok
        ? successResult({ value: result.value })
        : errorResult({ error: result.error });
    },
  };
}
