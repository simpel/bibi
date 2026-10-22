import { getEnv } from "@bibi/config";
import { type AiFeatureId, ok, type Result, resolveAiModel } from "@bibi/core";
import { createGateway, type LanguageModel } from "ai";

export type GatewayLanguageModelInput = { modelId: string };

/** A language model through the Vercel AI Gateway (`AI_GATEWAY_API_KEY` from config). */
export function gatewayLanguageModel({ modelId }: GatewayLanguageModelInput): LanguageModel {
  return createGateway({ apiKey: getEnv().AI_GATEWAY_API_KEY })(modelId);
}

export type ChosenModel = { model: LanguageModel; modelId: string };

export type ConfiguredLanguageModelInput = { feature: AiFeatureId };

/**
 * The model a superadmin chose for the feature, e.g. `assistant.chat` (ADR 0015). No
 * fallback: unconfigured → UNAVAILABLE (logged as `ai.modelNotConfigured` by core).
 */
export async function configuredLanguageModel({
  feature,
}: ConfiguredLanguageModelInput): Promise<Result<ChosenModel>> {
  const modelId = await resolveAiModel({ feature });
  if (!modelId.ok) return modelId;
  return ok({
    value: { model: gatewayLanguageModel({ modelId: modelId.value }), modelId: modelId.value },
  });
}
