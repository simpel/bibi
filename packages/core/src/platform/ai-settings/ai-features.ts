/**
 * Every AI feature whose model a platform admin can choose (ADR 0015). New AI capability = one
 * entry here, `resolveAiModel({ feature })` where it runs, and labels in i18n
 * (`admin.aiModels.features`). No env defaults: a platform admin must choose every model, and an
 * unconfigured feature fails (UNAVAILABLE). Client-safe: no config or database imports.
 *
 * `requires` is what makes a model *possible* for the feature; only such models are offered and
 * accepted. `dimensions` must equal `EMBEDDING_DIMENSIONS` in `@okazi/db` (asserted in a test).
 */
export const AI_FEATURES = [
  {
    id: "assistant.chat",
    modelType: "language",
    requiresReindex: false,
    // The assistant works through MCP tools.
    requires: { tags: ["tool-use"], dimensions: null },
  },
  {
    // The first setup of a new organization (ADR 0045): the assistant on `/onboarding`.
    id: "onboarding",
    modelType: "language",
    requiresReindex: false,
    requires: { tags: ["tool-use"], dimensions: null },
  },
  {
    id: "search.embedding",
    modelType: "embedding",
    requiresReindex: true,
    // The pgvector column is vector(1536).
    requires: { tags: [], dimensions: 1536 },
  },
] as const;

export type AiFeature = (typeof AI_FEATURES)[number];

export type AiFeatureId = AiFeature["id"];

export const AI_FEATURE_IDS = AI_FEATURES.map((feature) => feature.id) as [
  AiFeatureId,
  ...AiFeatureId[],
];

export type AiFeatureInput = { feature: AiFeatureId };

export function aiFeature({ feature }: AiFeatureInput): AiFeature {
  const found = AI_FEATURES.find((candidate) => candidate.id === feature);
  if (!found) throw new Error(`Unknown AI feature ${feature}`);
  return found;
}
