import type { Result } from "@okazi/core";
import { callMcpTool } from "../mcp/call-mcp-tool";
import { connectMcp } from "../mcp/connect-mcp";
import { resolveUser, type UserContext } from "../server/resolve-user";
import { type AssistantServerOptions, resolveServerOptions } from "../server/server-options";

export type ConfirmApprovalInput = AssistantServerOptions & {
  approvalToken: string;
  /** The user's request headers (session cookie). */
  headers: Headers;
  /** Already-resolved user (skips a second lookup). */
  user?: UserContext;
};

/**
 * Executes an AI proposal the user approved: MCP `approval_confirm` with the user's OWN token and
 * WITHOUT `x-okazi-actor: ai` (apps/mcp refuses AI callers). The server runs the operation as
 * actor `ai` + conversation id with `approvedBy` = this user, so the audit trail stays honest.
 */
export async function confirmApproval({
  approvalToken,
  headers,
  user,
  ...options
}: ConfirmApprovalInput): Promise<Result<Record<string, unknown>>> {
  const { resolveContext, getAccessToken, mcpUrl } = resolveServerOptions(options);
  const resolved = user
    ? { ok: true as const, value: user }
    : await resolveUser({ headers, resolveContext });
  if (!resolved.ok) return resolved;
  const { userId } = resolved.value.actor;
  const caller = { userId, organizationId: resolved.value.organizationId };
  const token = await getAccessToken({ headers, caller });
  if (!token.ok) return token;
  const client = await connectMcp({
    accessToken: token.value,
    caller: { kind: "user" },
    ...(mcpUrl ? { url: mcpUrl } : {}),
  });
  try {
    return await callMcpTool({ client, name: "approval_confirm", args: { approvalToken } });
  } finally {
    await client.close();
  }
}
