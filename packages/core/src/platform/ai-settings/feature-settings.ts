import type { PlatformDb } from "../types";
import { AI_FEATURES, type AiFeatureId, aiFeature } from "./ai-features";
import type { AiFeatureSetting } from "./schema";

type Row = { feature: string; modelId: string; updatedAt: Date; updatedBy: string };

export type ToSettingInput = { feature: AiFeatureId; row: Row | null | undefined };

/** Setting of one feature; `modelId: null` = not configured, the feature fails until it is. */
export function toSetting({ feature, row }: ToSettingInput): AiFeatureSetting {
  return {
    ...aiFeature({ feature }),
    modelId: row?.modelId ?? null,
    updatedAt: row?.updatedAt ?? null,
    updatedBy: row?.updatedBy ?? null,
  };
}

export type FeatureSettingsInput = { db: PlatformDb };

export async function featureSettings({ db }: FeatureSettingsInput): Promise<AiFeatureSetting[]> {
  const rows = await db.aiSetting.findMany();
  return AI_FEATURES.map(({ id }) =>
    toSetting({ feature: id, row: rows.find((row) => row.feature === id) }),
  );
}

export type SaveSettingInput = {
  db: PlatformDb;
  feature: AiFeatureId;
  modelId: string;
  updatedBy: string;
};

/** Sets the feature's model; returns the before/after rows for the audit trail. */
export async function saveSetting({ db, feature, modelId, updatedBy }: SaveSettingInput) {
  const before = await db.aiSetting.findUnique({ where: { feature } });
  const after = await db.aiSetting.upsert({
    where: { feature },
    create: { feature, modelId, updatedBy },
    update: { modelId, updatedBy },
  });
  return { before, after };
}
