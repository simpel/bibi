import { z } from "zod";
import { appError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { definePlatformOperation } from "../define-platform-operation";
import { featureSettings, saveSetting, toSetting } from "./feature-settings";
import { clearAiModelCache } from "./resolve-ai-model";
import {
  AiFeatureListOutputSchema,
  AiFeatureSettingSchema,
  AiFeatureUpdateInputSchema,
  AiModelListInputSchema,
  AiModelListOutputSchema,
  type ListCompatibleModels,
} from "./schema";

export const listAiFeatures = definePlatformOperation({
  name: "aiFeature.list",
  kind: "query",
  description: "List the AI features with the model each one runs on (null = not configured).",
  input: z.object({}),
  output: AiFeatureListOutputSchema,
  handler: async ({ context }) => ok({ value: { items: await featureSettings(context) } }),
});

export type CreateAiSettingOperationsInput = { listCompatibleModels: ListCompatibleModels };

function createListAiModels({ listCompatibleModels }: CreateAiSettingOperationsInput) {
  return definePlatformOperation({
    name: "aiModel.list",
    kind: "query",
    description: "List the AI Gateway models that are possible for one AI feature, with prices.",
    input: AiModelListInputSchema,
    output: AiModelListOutputSchema,
    handler: async ({ input }) => ok({ value: { items: await listCompatibleModels(input) } }),
  });
}

function createUpdateAiFeature({ listCompatibleModels }: CreateAiSettingOperationsInput) {
  return definePlatformOperation({
    name: "aiFeature.update",
    kind: "command",
    description: "Choose the model an AI feature runs on (must be possible for the feature).",
    input: AiFeatureUpdateInputSchema,
    output: AiFeatureSettingSchema,
    entityType: "aiSetting",
    handler: async ({ input: { feature, modelId }, context }) => {
      // Only models that meet the feature requirements (tools, 1536 dimensions, ...).
      const possible = await listCompatibleModels({ feature });
      if (!possible.some((model) => model.id === modelId)) {
        const message = `${modelId} is not a possible model for ${feature}`;
        const issues = [{ path: "modelId", message }];
        return err({ error: appError({ code: "VALIDATION", message, issues }) });
      }
      const updatedBy = context.actor.userId ?? "system";
      const change = await saveSetting({ db: context.db, feature, modelId, updatedBy });
      context.recordChange({ entityId: feature, ...change });
      clearAiModelCache();
      return ok({ value: toSetting({ feature, row: change.after }) });
    },
  });
}

/** Operations that need the live model catalog (injected, see `ListAiModels`). */
export function createAiSettingOperations({
  listCompatibleModels,
}: CreateAiSettingOperationsInput) {
  return {
    listAiModels: createListAiModels({ listCompatibleModels }),
    updateAiFeature: createUpdateAiFeature({ listCompatibleModels }),
  };
}
