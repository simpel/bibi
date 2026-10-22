import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { AiFeatureId } from "./ai-features";

/** Settings change rarely; other processes (MCP) pick up a change within this time. */
const TTL_MS = 30_000;

const cache = new Map<AiFeatureId, { modelId: string; expires: number }>();

export type ResolveAiModelInput = { feature: AiFeatureId; db?: Db };

/**
 * The model id an AI feature runs on: the superadmin's choice (`AiSetting`, ADR 0015).
 * There is no fallback: an unconfigured feature fails with UNAVAILABLE and logs
 * `ai.modelNotConfigured` at error level on every attempt, until an admin picks a model.
 */
export async function resolveAiModel({
  feature,
  db,
}: ResolveAiModelInput): Promise<Result<string>> {
  const cached = cache.get(feature);
  if (cached && cached.expires > Date.now()) return ok({ value: cached.modelId });
  const row = await (db ?? getDb()).aiSetting.findUnique({ where: { feature } });
  if (!row) {
    getLogger().error({ event: "ai.modelNotConfigured", feature });
    const message = `No model is configured for the AI feature ${feature}`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  cache.set(feature, { modelId: row.modelId, expires: Date.now() + TTL_MS });
  return ok({ value: row.modelId });
}

/** Drops cached choices in this process (after an admin change, and in tests). */
export function clearAiModelCache(): void {
  cache.clear();
}
