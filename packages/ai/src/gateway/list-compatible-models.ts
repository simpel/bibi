import { type AiModel, aiFeature, type ListCompatibleModels } from "@okazi/core";
import type { ListGatewayModels } from "./list-gateway-models";
import type { ProbeEmbedding } from "./probe-embedding";

export type CreateListCompatibleModelsInput = {
  listModels: ListGatewayModels;
  probeEmbedding: ProbeEmbedding;
};

type Requirements = ReturnType<typeof aiFeature>;

const meetsCatalog = ({ model, feature }: { model: AiModel; feature: Requirements }) =>
  model.type === feature.modelType &&
  feature.requires.tags.every((tag) => model.tags.includes(tag));

/**
 * Core's `ListCompatibleModels` (ADR 0015): catalog models of the feature's type with its
 * required tags, and for embedding features only those that pass the dimension probe.
 */
export function createListCompatibleModels({
  listModels,
  probeEmbedding,
}: CreateListCompatibleModelsInput): ListCompatibleModels {
  return async ({ feature: id }) => {
    const feature = aiFeature({ feature: id });
    const candidates = (await listModels()).filter((model) => meetsCatalog({ model, feature }));
    if (!feature.requires.dimensions) return candidates;
    const probed = await Promise.all(
      candidates.map(async (model) =>
        (await probeEmbedding({ modelId: model.id })) ? model : null,
      ),
    );
    return probed.filter((model): model is AiModel => model !== null);
  };
}
