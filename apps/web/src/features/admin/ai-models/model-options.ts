import type { AiFeatureId, AiFeatureSetting, AiModel } from "@okazi/core/schemas";

/** i18n key under `admin.aiModels.features` (next-intl keys cannot contain dots). */
export const FEATURE_KEY = {
  "assistant.chat": "assistantChat",
  onboarding: "onboarding",
  "search.embedding": "searchEmbedding",
} as const satisfies Record<AiFeatureId, string>;

/** One table row: a feature and the models that are possible for it (`null` = catalog failed). */
export type AiFeatureRow = { setting: AiFeatureSetting; models: AiModel[] | null };

export type ProviderGroup = { provider: string; models: AiModel[] };

export type GroupByProviderInput = { models: readonly AiModel[] };

/** Models grouped by provider (catalog order is by id, so groups come out sorted). */
export function groupByProvider({ models }: GroupByProviderInput): ProviderGroup[] {
  const groups = new Map<string, AiModel[]>();
  for (const model of models)
    groups.set(model.provider, [...(groups.get(model.provider) ?? []), model]);
  return [...groups].map(([provider, entries]) => ({ provider, models: entries }));
}

export type PerMillionInput = { price: string | null };

/** Gateway prices are USD per token; people compare per million tokens. */
export function perMillion({ price }: PerMillionInput): number | null {
  if (price === null) return null;
  const value = Number(price);
  return Number.isFinite(value) ? value * 1_000_000 : null;
}
