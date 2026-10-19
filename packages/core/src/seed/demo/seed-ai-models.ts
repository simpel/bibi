import type { Db } from "@okazi/db";
import { AI_FEATURE_IDS } from "../../platform/ai-settings/ai-features";
import { DEMO_AI_MODELS } from "./ai-models";

export type SeedAiModelsInput = { db: Db; updatedBy: string };

/**
 * Gives every AI feature that has no model yet its demo model. A model a superadmin already
 * chose is left alone, so reseeding never undoes `/admin/ai-models`.
 */
export async function seedAiModels({ db, updatedBy }: SeedAiModelsInput): Promise<void> {
  for (const feature of AI_FEATURE_IDS) {
    await db.aiSetting.upsert({
      where: { feature },
      create: { feature, modelId: DEMO_AI_MODELS[feature], updatedBy },
      update: {},
    });
  }
}
