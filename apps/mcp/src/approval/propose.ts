import {
  type AnyOperation,
  appError,
  type ExecuteContext,
  err,
  fromZodError,
  hasPermission,
  ok,
  type Result,
} from "@okazi/core";
import type { McpToolMeta } from "../tools/meta";
import { toJsonValue } from "../tools/results";
import { signApprovalToken } from "./sign";
import type { ApprovalRequired } from "./types";

export type ProposeInput = {
  operation: AnyOperation;
  meta: McpToolMeta | undefined;
  args: unknown;
  context: ExecuteContext;
  secret: string;
};

type SummaryInput = {
  meta: McpToolMeta | undefined;
  operation: AnyOperation;
  input: Record<string, unknown>;
  context: ExecuteContext;
};

async function summarize({ meta, operation, input, context }: SummaryInput): Promise<string> {
  if (meta?.summary) return meta.summary({ input, context });
  return `${operation.name} ${JSON.stringify(input)}`;
}

/**
 * Turns an AI-proposed command into an `approval_required` result without executing it. Input
 * and permission are checked first so the user is never asked to approve something that fails.
 */
export async function proposeApproval({
  operation,
  meta,
  args,
  context,
  secret,
}: ProposeInput): Promise<Result<ApprovalRequired>> {
  const userId = context.actor.userId;
  if (!userId)
    return err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  const parsed = operation.input.safeParse(args);
  if (!parsed.success) return err({ error: fromZodError({ error: parsed.error }) });
  if (!hasPermission({ permissions: context.permissions, permission: operation.permission })) {
    return err({
      error: appError({ code: "FORBIDDEN", message: `Missing permission ${operation.permission}` }),
    });
  }
  const input = toJsonValue({ value: parsed.data });
  const { token, claims } = signApprovalToken({
    operation: operation.name,
    input,
    organizationId: context.organizationId,
    userId,
    conversationId: context.actor.conversationId,
    secret,
  });
  const summary = await summarize({ meta, operation, input, context });
  return ok({
    value: {
      status: "approval_required",
      operation: operation.name,
      input,
      summary,
      approvalToken: token,
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    },
  });
}
