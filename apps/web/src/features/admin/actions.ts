"use server";

import type { AiFeatureId, AiFeatureSetting } from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { toActionResult } from "@/server/to-action-result";

export type UpdateAiFeatureActionInput = { feature: AiFeatureId; modelId: string };

/** Sets the model of one AI feature. Superadmins only. */
export async function updateAiFeatureAction({
  feature,
  modelId,
}: UpdateAiFeatureActionInput): Promise<ActionResult<AiFeatureSetting>> {
  const result = await runPlatformOperation({
    operation: platformOperations().updateAiFeature,
    input: { feature, modelId },
  });
  return toActionResult({ result });
}
