import type { Db } from "@bibi/db";
import { AI_FEATURE_IDS } from "../../platform/ai-settings/ai-features";

/** Every AI feature has a model, so none fails with UNAVAILABLE right after the seed. */
export async function checkDemoAiModels({ db }: { db: Db }): Promise<string[]> {
  const rows = await db.aiSetting.findMany();
  return AI_FEATURE_IDS.filter((id) => !rows.some((row) => row.feature === id)).map(
    (id) => `AI feature ${id}: no model configured`,
  );
}
