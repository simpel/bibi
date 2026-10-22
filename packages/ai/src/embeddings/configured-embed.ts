import { type EmbedFn, resolveAiModel } from "@bibi/core";
import { createGateway } from "ai";
import { embedTexts } from "./embed-texts";

export type ConfiguredEmbedInput = { apiKey: string | undefined; maxBatchSize: number };

/**
 * Embeds with the model a superadmin chose for `search.embedding` (ADR 0015), resolved per
 * call (cached 30 s by core). Unconfigured → throws UNAVAILABLE: search fails, indexing after a
 * command is logged as `operation.afterCommitFailed`.
 */
export function configuredEmbed({ apiKey, maxBatchSize }: ConfiguredEmbedInput): EmbedFn {
  const gateway = createGateway({ apiKey });
  return async ({ texts }) => {
    const modelId = await resolveAiModel({ feature: "search.embedding" });
    if (!modelId.ok) throw modelId.error;
    const model = gateway.embeddingModel(modelId.value);
    return embedTexts({ model, modelId: modelId.value, texts, maxBatchSize });
  };
}
