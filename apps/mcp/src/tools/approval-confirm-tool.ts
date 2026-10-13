import type { AfterCommitHook, AnyOperation } from "@okazi/core";
import { z } from "zod";
import { confirmApproval } from "../approval/confirm";
import { toJsonSchema } from "./json-schema";
import { errorResult, successResult } from "./results";
import type { McpTool, RunToolInput } from "./types";
import { appError } from "@okazi/core";

export const ApprovalConfirmInputSchema = z.object({
  approvalToken: z.string().min(1).describe("Token from an approval_required result"),
});

export type ApprovalConfirmToolInput = {
  operations: readonly AnyOperation[];
  afterCommit: readonly AfterCommitHook[];
  secret: string;
};

/**
 * `approval_confirm`: executes a proposal the user approved. Called by the Okazi web app with the
 * user's own (non-AI) credentials; the assistant never sees or calls it.
 */
export function createApprovalConfirmTool(deps: ApprovalConfirmToolInput): McpTool {
  return {
    name: "approval_confirm",
    description:
      "Executes a command the user approved. Only the Okazi web app calls this, after the user " +
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
        const error = appError({ code: "VALIDATION", message: "approvalToken is required" });
        return errorResult({ error });
      }
      const result = await confirmApproval({ token: parsed.data.approvalToken, context, ...deps });
      return result.ok ? successResult({ value: result.value }) : errorResult({ error: result.error });
    },
  };
}
