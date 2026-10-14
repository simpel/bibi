import { getEnv } from "@okazi/config";
import { AppError, type EmbedFn } from "@okazi/core";
import { createGateway, type EmbeddingModel } from "ai";
import { DEFAULT_EMBED_BATCH_SIZE, embedTexts } from "./embed-texts";
import { hashEmbedding, PLACEHOLDER_EMBEDDING_MODEL } from "./hash-embedding";

/** Core's `EmbedFn` plus the model id it writes to `Embedding.model`. */
export type AssistantEmbedFn = EmbedFn & { readonly model: string };

export type CreateEmbedInput = {
  /** Explicit model (tests: `MockEmbeddingModelV4`). Default: `AI_EMBEDDING_MODEL` via Gateway. */
  model?: Exclude<EmbeddingModel, string>;
  /** Stored model id; default `model.modelId` or `AI_EMBEDDING_MODEL`. */
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

type WithModelInput = { fn: EmbedFn; model: string };

const withModel = ({ fn, model }: WithModelInput): AssistantEmbedFn => Object.assign(fn, { model });

const defaultWarn = ({ message }: { message: string }) => console.warn(message);

type PlaceholderInput = { warn: (input: { message: string }) => void };

function placeholderEmbed({ warn }: PlaceholderInput): AssistantEmbedFn {
  if (!warned) {
    warned = true;
    warn({
      message:
        "[@okazi/ai] AI_GATEWAY_API_KEY is not set: using the placeholder hash embedder " +
        `(${PLACEHOLDER_EMBEDDING_MODEL}). Semantic search is keyword-like until a key is set ` +
        "and `pnpm --filter @okazi/ai reindex` has run.",
    });
  }
  const fn = withModel({
    fn: async ({ texts }) => ({
      model: PLACEHOLDER_EMBEDDING_MODEL,
      embeddings: texts.map((text) => hashEmbedding({ text })),
    }),
    model: PLACEHOLDER_EMBEDDING_MODEL,
  });
  placeholders.add(fn);
  return fn;
}

const missingKeyEmbed = ({ model }: { model: string }): AssistantEmbedFn =>
  withModel({
    fn: async () => {
      const message = "AI_GATEWAY_API_KEY is not set: embeddings are unavailable in production";
      throw new AppError({ code: "INTERNAL", message });
    },
    model,
  });

/**
 * The embedder injected into core (`search`, indexing hook, reindex). Real embeddings via the AI
 * SDK (`embedMany`, AI Gateway, `AI_EMBEDDING_MODEL`, 1536 dimensions). Without
 * `AI_GATEWAY_API_KEY`: deterministic placeholder outside production, failing embedder in it.
 */
export function createEmbed({
  model,
  modelId: modelIdInput,
  apiKey: apiKeyInput,
  nodeEnv,
  maxBatchSize = DEFAULT_EMBED_BATCH_SIZE,
  warn = defaultWarn,
}: CreateEmbedInput = {}): AssistantEmbedFn {
  const env = getEnv();
  const modelId = modelIdInput ?? model?.modelId ?? env.AI_EMBEDDING_MODEL;
  const apiKey = apiKeyInput === undefined ? env.AI_GATEWAY_API_KEY : apiKeyInput;
  if (!model && !apiKey) {
    return (nodeEnv ?? env.NODE_ENV) === "production"
      ? missingKeyEmbed({ model: modelId })
      : placeholderEmbed({ warn });
  }
  const resolved = model ?? createGateway({ apiKey: apiKey ?? undefined }).embeddingModel(modelId);
  return withModel({
    fn: ({ texts }) => embedTexts({ model: resolved, modelId, texts, maxBatchSize }),
    model: modelId,
  });
}
