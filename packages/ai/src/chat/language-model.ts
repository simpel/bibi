import { getEnv } from "@okazi/config";
import { ok, type Result, resolveAiModel } from "@okazi/core";
import { createGateway, type LanguageModel } from "ai";

export type GatewayLanguageModelInput = { modelId: string };

/** A language model through the Vercel AI Gateway (`AI_GATEWAY_API_KEY` from config). */
export function gatewayLanguageModel({ modelId }: GatewayLanguageModelInput): LanguageModel {
  return createGateway({ apiKey: getEnv().AI_GATEWAY_API_KEY })(modelId);
}

export type ChosenModel = { model: LanguageModel; modelId: string };

/**
 * The model a platform admin chose for `assistant.chat` (ADR 0015). No fallback: unconfigured
 * → UNAVAILABLE (logged as `ai.modelNotConfigured` by core).
 */
export async function configuredLanguageModel(): Promise<Result<ChosenModel>> {
  const modelId = await resolveAiModel({ feature: "assistant.chat" });
  if (!modelId.ok) return modelId;
  return ok({
    value: { model: gatewayLanguageModel({ modelId: modelId.value }), modelId: modelId.value },
  });
}
