import { fromUnknown } from "@bibi/core";
import { getLogger, withRequestLogging } from "@bibi/logger";
import { errorResponse } from "../server/error-response";
import { readJsonBody } from "../server/read-json-body";
import { resolveUser, type UserContext } from "../server/resolve-user";
import {
  type AssistantServerOptions,
  type ResolvedServerOptions,
  resolveServerOptions,
} from "../server/server-options";
import {
  type ApprovalRequest,
  ApprovalRequestSchema,
  type ApprovalResponse,
} from "./approval-request";
import { confirmApproval } from "./confirm-approval";
import { logDecision } from "./log-decision";
import { recordApprovalDecision } from "./record-approval-decision";
import { rejectApproval } from "./reject-approval";

type DecideInput = {
  body: ApprovalRequest;
  user: UserContext;
  headers: Headers;
  options: ResolvedServerOptions;
};

async function approve({ body, user, headers, options }: DecideInput): Promise<Response> {
  const { conversationId, toolCallId, operation } = body;
  const result = await confirmApproval({
    ...options,
    approvalToken: body.approvalToken,
    headers,
    user,
  });
  if (conversationId) {
    await recordApprovalDecision({
      user,
      embed: options.embed,
      conversationId,
      decision: result.ok ? "approved" : "failed",
      detail: result.ok ? result.value : { code: result.error.code, message: result.error.message },
      ...(toolCallId ? { toolCallId } : {}),
      ...(operation ? { operation } : {}),
    });
  }
  if (!result.ok) return errorResponse({ error: result.error });
  const response: ApprovalResponse = { status: "approved", result: result.value };
  return Response.json(response);
}

async function reject({ body, user, options }: DecideInput): Promise<Response> {
  const { conversationId, toolCallId, operation } = body;
  const result = await rejectApproval({
    user,
    embed: options.embed,
    ...(conversationId ? { conversationId } : {}),
    ...(toolCallId ? { toolCallId } : {}),
    ...(operation ? { operation } : {}),
  });
  if (!result.ok) return errorResponse({ error: result.error });
  const response: ApprovalResponse = { status: "rejected" };
  return Response.json(response);
}

/**
 * Route-agnostic `POST` handler for the approval card: `(request) => Response`. Authenticates the
 * *user* (cookie session), then approves via MCP `approval_confirm` as the user or records a
 * rejection. Mount e.g. as `app/api/assistant/approval/route.ts`.
 */
export function createApprovalHandler({
  resolveContext,
  getAccessToken,
  mcpUrl,
  embed,
}: AssistantServerOptions) {
  const options = resolveServerOptions({ resolveContext, getAccessToken, mcpUrl, embed });
  return withRequestLogging({
    surface: "ai",
    handler: async (request) => {
      try {
        const { headers } = request;
        const user = await resolveUser({ headers, resolveContext: options.resolveContext });
        if (!user.ok) return errorResponse({ error: user.error });
        const body = await readJsonBody({ request, schema: ApprovalRequestSchema });
        if (!body.ok) return errorResponse({ error: body.error });
        const decide = body.value.decision === "approve" ? approve : reject;
        const response = await decide({ body: body.value, user: user.value, headers, options });
        logDecision({ body: body.value, status: response.status });
        return response;
      } catch (error) {
        getLogger().error({ event: "approval.failed", err: error });
        return errorResponse({ error: fromUnknown({ error }) });
      }
    },
  });
}
