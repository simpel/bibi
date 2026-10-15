import {
  type AfterCommitHook,
  type AnyOperation,
  execute,
  requiresApproval,
  UNTRUSTED_OUTPUT_META_KEY,
} from "@okazi/core";
import { logProposal } from "../approval/log-proposal";
import { proposeApproval } from "../approval/propose";
import { toAnnotations } from "./annotations";
import { describeOperation } from "./describe";
import { toJsonSchema } from "./json-schema";
import type { McpToolMeta } from "./meta";
import { errorResult, successResult } from "./results";
import { toToolName } from "./tool-name";
import type { McpTool, RunToolInput } from "./types";

export type OperationToolInput = {
  operation: AnyOperation;
  meta: McpToolMeta | undefined;
  afterCommit: readonly AfterCommitHook[];
  secret: string;
};

const APPROVAL_SCHEMA = {
  type: "object",
  properties: {
    status: { const: "approval_required" },
    operation: { type: "string" },
    input: {},
    summary: { type: "string" },
    approvalToken: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
  },
  required: ["status", "operation", "summary", "approvalToken"],
};

/** Commands needing approval may answer with the output or an `approval_required` proposal. */
function outputSchemaOf({ operation }: { operation: AnyOperation }) {
  const output = toJsonSchema({ schema: operation.output, io: "output" });
  if (operation.kind === "query" || !operation.approval) return output;
  return { type: "object", anyOf: [output, APPROVAL_SCHEMA] };
}

/** One MCP tool per core operation. Commands from the AI actor are proposed, never executed. */
export function createOperationTool({
  operation,
  meta,
  afterCommit,
  secret,
}: OperationToolInput): McpTool {
  return {
    name: meta?.toolName ?? toToolName({ operation: operation.name }),
    description: describeOperation({ operation }),
    inputSchema: toJsonSchema({ schema: operation.input, io: "input" }),
    outputSchema: outputSchemaOf({ operation }),
    annotations: { title: operation.name, ...toAnnotations({ operation, meta }) },
    ...(operation.untrustedOutput && { _meta: { [UNTRUSTED_OUTPUT_META_KEY]: true } }),
    async run({ args, context }: RunToolInput) {
      if (requiresApproval({ operation, actor: context.actor })) {
        const proposal = await proposeApproval({ operation, meta, args, context, secret });
        logProposal({ operation, proposal });
        return proposal.ok
          ? successResult({ value: proposal.value })
          : errorResult({ error: proposal.error });
      }
      const result = await execute({ operation, input: args ?? {}, context, afterCommit });
      return result.ok
        ? successResult({ value: result.value })
        : errorResult({ error: result.error });
    },
  };
}
