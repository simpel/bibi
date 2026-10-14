import { getEnv } from "@okazi/config";
import { type AiModel, AiModelTypeSchema, AppError } from "@okazi/core";
import { getLogger } from "@okazi/logger";
import { type GatewayCatalog, GatewayCatalogSchema } from "./gateway-catalog-schema";

export const GATEWAY_MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";

const TTL_MS = 10 * 60_000;
const TIMEOUT_MS = 10_000;

let cache: { models: AiModel[]; expires: number } | undefined;

type Entry = GatewayCatalog["data"][number];

// Batch-only variants cannot serve interactive calls; deprecated models are on their way out.
const usable = ({ entry }: { entry: Entry }): boolean =>
  !entry.id.endsWith("-batch") && entry.deprecated_at == null;

function toModel({ entry }: { entry: Entry }): AiModel | null {
  const type = AiModelTypeSchema.safeParse(entry.type);
  if (!type.success || !usable({ entry })) return null;
  return {
    id: entry.id,
    name: entry.name ?? entry.id,
    provider: entry.owned_by ?? entry.id.split("/")[0] ?? "",
    type: type.data,
    description: entry.description ?? null,
    contextWindow: entry.context_window ?? null,
    inputPrice: entry.pricing?.input ?? null,
    outputPrice: entry.pricing?.output ?? null,
    tags: entry.tags ?? [],
  };
}

async function fetchCatalog({ fetchFn }: { fetchFn: typeof fetch }): Promise<AiModel[]> {
  const apiKey = getEnv().AI_GATEWAY_API_KEY;
  const response = await fetchFn(GATEWAY_MODELS_URL, {
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`AI Gateway answered ${response.status}`);
  const catalog = GatewayCatalogSchema.parse(await response.json());
  return catalog.data
    .map((entry) => toModel({ entry }))
    .filter((model): model is AiModel => model !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export type CreateListGatewayModelsInput = { fetchFn?: typeof fetch };

/** Every usable model in the gateway catalog (no batch-only or deprecated variants). */
export type ListGatewayModels = () => Promise<AiModel[]>;

/**
 * The Vercel AI Gateway catalog (ADR 0015), normalised. Cached 10 min per
 * process; a failed fetch is logged and surfaces as an INTERNAL error (no stale fallback).
 */
export function createListGatewayModels({
  fetchFn = fetch,
}: CreateListGatewayModelsInput = {}): ListGatewayModels {
  return async () => {
    if (cache && cache.expires > Date.now()) return cache.models;
    try {
      const models = await fetchCatalog({ fetchFn });
      cache = { models, expires: Date.now() + TTL_MS };
      return models;
    } catch (error) {
      getLogger().error({ event: "ai.modelCatalogFailed", url: GATEWAY_MODELS_URL, err: error });
      throw new AppError({ code: "INTERNAL", message: "Model catalog unavailable", cause: error });
    }
  };
}

/** Test seam: forget the cached catalog. */
export function clearGatewayModelCache(): void {
  cache = undefined;
}
