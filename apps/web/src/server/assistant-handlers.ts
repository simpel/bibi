import "server-only";
import { createApprovalHandler, createChatHandler } from "@bibi/ai";
import { resolveExecuteContext } from "@bibi/auth";
import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import { embed } from "./embed";
import { shouldUseMockModel } from "./mock-model-policy";
import { ensureOperations } from "./operations";

type Handler = (request: Request) => Promise<Response>;

const holder = globalThis as typeof globalThis & {
  __bibiChat?: Promise<Handler>;
  __bibiApproval?: Handler;
};

async function buildChatHandler(): Promise<Handler> {
  ensureOperations();
  const base = { resolveContext: resolveExecuteContext, embed };
  const { E2E_MOCK_MODEL, NODE_ENV } = getEnv();
  if (!shouldUseMockModel({ flag: E2E_MOCK_MODEL, nodeEnv: NODE_ENV })) {
    if (E2E_MOCK_MODEL) {
      getLogger().warn({ event: "config.ignored", msg: "E2E_MOCK_MODEL is ignored in production" });
    }
    return createChatHandler(base);
  }
  // Only loaded when the flag is on: keeps `ai/test` and the script out of normal runs.
  const { createE2eMockModel } = await import("./e2e-mock-model");
  return createChatHandler({ ...base, model: createE2eMockModel(), modelId: "e2e-mock-model" });
}

/** `POST /api/chat`: the assistant turn (AI SDK UI message stream), see `@bibi/ai`. */
export function chatHandler(): Handler {
  return async (request) => {
    holder.__bibiChat ??= buildChatHandler();
    return (await holder.__bibiChat)(request);
  };
}

/** `POST /api/assistant/approval`: the user's decision on a proposed change. */
export function approvalHandler(): Handler {
  holder.__bibiApproval ??= createApprovalHandler({
    resolveContext: resolveExecuteContext,
    embed,
  });
  return holder.__bibiApproval;
}
