import { getEnv } from "@okazi/config";
import { AppError, type EmbedFn } from "@okazi/core";
import { getLogger } from "@okazi/logger";
import type { EmbeddingModel } from "ai";
import { configuredEmbed } from "./configured-embed";
import { DEFAULT_EMBED_BATCH_SIZE, embedTexts } from "./embed-texts";
import { hashEmbedding, PLACEHOLDER_EMBEDDING_MODEL } from "./hash-embedding";

export type CreateEmbedInput = {
  /** Test seam (`MockEmbeddingModelV4`). Default: the model a platform admin chose (ADR 0015). */
  model?: Exclude<EmbeddingModel, string>;
  /** Stored model id with an explicit `model`; default `model.modelId`. */
  modelId?: string;
  /** Overrides for tests; default from `@okazi/config`. `null` = no key. */
  apiKey?: string | null;
  nodeEnv?: string;
  maxBatchSize?: number;
  warn?: (input: { message: string }) => void;
};

const placeholders = new WeakSet<EmbedFn>();
let warned = false;

export type IsPlaceholderEmbedInput = { embed: EmbedFn };

/** True for the deterministic dev/test fallback (no real semantic search). */
export function isPlaceholderEmbed({ embed }: IsPlaceholderEmbedInput): boolean {
  return placeholders.has(embed);
}

const defaultWarn = ({ message }: { message: string }) =>
  getLogger().warn({ event: "ai.placeholderEmbedder", msg: message });

type PlaceholderInput = { warn: (input: { message: string }) => void };

function placeholderEmbed({ warn }: PlaceholderInput): EmbedFn {
  if (!warned) {
    warned = true;
    warn({
      message:
        "[@okazi/ai] AI_GATEWAY_API_KEY is not set: using the placeholder hash embedder " +
        `(${PLACEHOLDER_EMBEDDING_MODEL}). Semantic search is keyword-like until a key is set ` +
        "and `pnpm --filter @okazi/ai reindex` has run.",
    });
  }
  const fn: EmbedFn = async ({ texts }) => ({
    model: PLACEHOLDER_EMBEDDING_MODEL,
    embeddings: texts.map((text) => hashEmbedding({ text })),
  });
  placeholders.add(fn);
  return fn;
}

const missingKeyEmbed: EmbedFn = async () => {
  const message = "AI_GATEWAY_API_KEY is not set: embeddings are unavailable in production";
  throw new AppError({ code: "UNAVAILABLE", message });
};

/**
 * The embedder injected into core (`search`, indexing hook, reindex): AI SDK `embedMany` via the
 * AI Gateway with the model a platform admin chose for `search.embedding` (1536 dimensions).
 * Without `AI_GATEWAY_API_KEY`: deterministic placeholder outside production, failing embedder in
 * it. No model chosen → every call fails with UNAVAILABLE (and an error log line).
 */
export function createEmbed({
  model,
  modelId,
  apiKey: apiKeyInput,
  nodeEnv,
  maxBatchSize = DEFAULT_EMBED_BATCH_SIZE,
  warn = defaultWarn,
}: CreateEmbedInput = {}): EmbedFn {
  const env = getEnv();
  if (model) {
    const id = modelId ?? model.modelId;
    return ({ texts }) => embedTexts({ model, modelId: id, texts, maxBatchSize });
  }
  const apiKey = apiKeyInput === undefined ? env.AI_GATEWAY_API_KEY : apiKeyInput;
  if (!apiKey) {
    return (nodeEnv ?? env.NODE_ENV) === "production"
      ? missingKeyEmbed
      : placeholderEmbed({ warn });
  }
  return configuredEmbed({ apiKey, maxBatchSize });
}
