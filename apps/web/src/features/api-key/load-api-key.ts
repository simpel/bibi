import "server-only";
import { type ApiKeyDto, getApiKey, type Result } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadApiKeyCached = cache(async (id: string): Promise<Result<ApiKeyDto>> => {
  return runOperation({ operation: getApiKey, input: { id } });
});

export type LoadApiKeyInput = { id: string };

/** The API key by its id, cached per request so metadata and page components share one read. */
export function loadApiKey({ id }: LoadApiKeyInput): Promise<Result<ApiKeyDto>> {
  return loadApiKeyCached(id);
}
