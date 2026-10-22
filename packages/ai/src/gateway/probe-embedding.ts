import { getEnv } from "@bibi/config";
import { getLogger } from "@bibi/logger";
import { createGateway } from "ai";
import { embedTexts } from "../embeddings/embed-texts";

/** A model's dimensions do not change: remember a pass for a day, a failure for 10 min. */
const PASS_TTL_MS = 24 * 3_600_000;
const FAIL_TTL_MS = 10 * 60_000;

const cache = new Map<string, { ok: boolean; expires: number }>();

export type ProbeEmbeddingInput = { modelId: string };

/** True when the model can embed into `vector(1536)`, by asking it once (`embedTexts` checks). */
export type ProbeEmbedding = (input: ProbeEmbeddingInput) => Promise<boolean>;

/**
 * The gateway catalog does not list output dimensions, so the only truthful check is one tiny
 * embed call (fractions of a cent, cached). Without `AI_GATEWAY_API_KEY` nothing is possible.
 */
export function createEmbeddingProbe(): ProbeEmbedding {
  const apiKey = getEnv().AI_GATEWAY_API_KEY;
  const gateway = apiKey ? createGateway({ apiKey }) : null;
  return async ({ modelId }) => {
    const cached = cache.get(modelId);
    if (cached && cached.expires > Date.now()) return cached.ok;
    if (!gateway) return false;
    let ok = true;
    try {
      const model = gateway.embeddingModel(modelId);
      await embedTexts({ model, modelId, texts: ["dimension probe"], maxBatchSize: 1 });
    } catch (error) {
      ok = false;
      getLogger().info({ event: "ai.embeddingProbeRejected", model: modelId, err: error });
    }
    cache.set(modelId, { ok, expires: Date.now() + (ok ? PASS_TTL_MS : FAIL_TTL_MS) });
    return ok;
  };
}
