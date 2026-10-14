import { createAiSettingOperations, listAiFeatures } from "./ai-settings/operations";
import type { ListCompatibleModels } from "./ai-settings/schema";
import { getSystemLog, listSystemLogs } from "./system-log/operations";

export type CreatePlatformOperationsInput = { listCompatibleModels: ListCompatibleModels };

/**
 * Platform operations (ADR 0015). Deliberately NOT part of `createCoreOperations` or the
 * registry: they are web-only, so GraphQL, REST and MCP (and therefore the AI) never see them.
 */
export function createPlatformOperations({ listCompatibleModels }: CreatePlatformOperationsInput) {
  const { listAiModels, updateAiFeature } = createAiSettingOperations({ listCompatibleModels });
  return {
    listSystemLogs,
    getSystemLog,
    listAiFeatures,
    listAiModels,
    updateAiFeature,
  } as const;
}

export type PlatformOperations = ReturnType<typeof createPlatformOperations>;
