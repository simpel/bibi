import { z } from "zod";
import { AI_FEATURE_IDS, type AiFeatureId } from "./ai-features";

export const AiModelTypeSchema = z.enum(["language", "embedding", "image", "video", "reranking"]);

/** One model from the Vercel AI Gateway catalog (`GET /v1/models`), normalised. */
export const AiModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: z.string(),
  type: AiModelTypeSchema,
  description: z.string().nullable(),
  contextWindow: z.number().nullable(),
  /** USD per token, as the gateway reports it (strings keep precision). */
  inputPrice: z.string().nullable(),
  outputPrice: z.string().nullable(),
  /** Gateway capability tags, e.g. `tool-use`, `reasoning`, `vision`. */
  tags: z.array(z.string()),
});

export type AiModel = z.infer<typeof AiModelSchema>;

export const AiFeatureIdSchema = z.enum(AI_FEATURE_IDS);

/**
 * The models that are *possible* for a feature (meet `AI_FEATURES[].requires`), sorted by id.
 * Injected by the app (`@bibi/ai`, gateway catalog + embedding probe): core has no network
 * or AI SDK dependency.
 */
export type ListCompatibleModels = (input: { feature: AiFeatureId }) => Promise<AiModel[]>;

export const AiModelListInputSchema = z.object({ feature: AiFeatureIdSchema });

export const AiModelListOutputSchema = z.object({ items: z.array(AiModelSchema) });

export const AiFeatureSettingSchema = z.object({
  id: AiFeatureIdSchema,
  modelType: z.enum(["language", "embedding"]),
  requiresReindex: z.boolean(),
  /** Chosen by a superadmin; `null` = not configured, the feature fails (UNAVAILABLE). */
  modelId: z.string().nullable(),
  updatedAt: z.date().nullable(),
  updatedBy: z.string().nullable(),
});

export type AiFeatureSetting = z.infer<typeof AiFeatureSettingSchema>;

export const AiFeatureListOutputSchema = z.object({ items: z.array(AiFeatureSettingSchema) });

export const AiFeatureUpdateInputSchema = z.object({
  feature: AiFeatureIdSchema,
  modelId: z.string().trim().min(1).max(200),
});
