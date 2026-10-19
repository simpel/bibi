import {
  type AnyOperation,
  appError,
  type ChangePreview,
  type ExecuteContext,
  err,
  fromZodError,
  hasPermission,
  ok,
  previewChange,
  type Result,
} from "@okazi/core";
import type { McpToolMeta } from "../tools/meta";
import { toJsonValue } from "../tools/results";
import { bindProposal } from "./bind";
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

type CheckInput = Pick<ProposeInput, "operation" | "args" | "context">;

/** The signed-in user and the parsed input, or why the proposal is refused before anything. */
function checkProposal({ operation, args, context }: CheckInput) {
  const userId = context.actor.userId;
  if (!userId)
    return err({ error: appError({ code: "UNAUTHENTICATED", message: "Sign in required" }) });
  const parsed = operation.input.safeParse(args);
  if (!parsed.success) return err({ error: fromZodError({ error: parsed.error }) });
  if (!hasPermission({ permissions: context.permissions, permission: operation.permission })) {
    const message = `Missing permission ${operation.permission}`;
    return err({ error: appError({ code: "FORBIDDEN", message }) });
  }
  return ok({ value: { userId, input: parsed.data as unknown } });
}

/**
 * Turns an AI-proposed command into an `approval_required` result without executing it. Input
 * and permission are checked first so the user is never asked to approve something that fails.
 * Server-bound facts (`meta.bind`) are added before signing, so the card shows what is signed.
 */
export async function proposeApproval({
  operation,
  meta,
  args,
  context,
  secret,
}: ProposeInput): Promise<Result<ApprovalRequired>> {
  const checked = checkProposal({ operation, args, context });
  if (!checked.ok) return checked;
  const { userId } = checked.value;
  const bound = await bindProposal({ meta, operation, input: checked.value.input, context });
  if (!bound.ok) return bound;
  // ADR 0049: the card shows what core computes, and a proposal that would fail is never shown.
  const preview = await previewChange({ operation, input: bound.value, context });
  if (!preview.ok) return preview;
  const input = toJsonValue({ value: bound.value });
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
      preview: toJsonValue({ value: preview.value }) as ChangePreview,
    },
  });
}
