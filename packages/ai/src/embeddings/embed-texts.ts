import { AppError, type EmbedOutput } from "@okazi/core";
import { EMBEDDING_DIMENSIONS } from "@okazi/db";
import { type EmbeddingModel, embedMany } from "ai";
import { z } from "zod";

/** Texts per `embedMany` call; providers cap requests (OpenAI: 2048 inputs, ~300k tokens). */
export const DEFAULT_EMBED_BATCH_SIZE = 96;

const VectorsSchema = z.array(z.array(z.number().finite()));

export type EmbedTextsInput = {
  model: EmbeddingModel;
  modelId: string;
  texts: readonly string[];
  maxBatchSize: number;
};

type CheckInput = { vectors: unknown; modelId: string; expected: number };

/** Zod-validates provider output and fails fast when the model cannot produce 1536 dimensions. */
function checkVectors({ vectors, modelId, expected }: CheckInput): number[][] {
  const parsed = VectorsSchema.safeParse(vectors);
  if (!parsed.success || parsed.data.length !== expected) {
    throw new AppError({
      code: "INTERNAL",
      message: `Embedding model ${modelId} returned no data`,
    });
  }
  const wrong = parsed.data.find((vector) => vector.length !== EMBEDDING_DIMENSIONS);
  if (wrong) {
    const message =
      `Embedding model ${modelId} returned ${wrong.length} dimensions, expected ` +
      `${EMBEDDING_DIMENSIONS}. Pick a model that supports ${EMBEDDING_DIMENSIONS} dimensions ` +
      "(/admin/ai-models) or migrate the vector column.";
    throw new AppError({ code: "INTERNAL", message });
  }
  return parsed.data;
}

/** `embedMany` via the AI SDK in bounded batches, asking the provider for 1536 dimensions. */
export async function embedTexts({
  model,
  modelId,
  texts,
  maxBatchSize,
}: EmbedTextsInput): Promise<EmbedOutput> {
  const embeddings: number[][] = [];
  for (let start = 0; start < texts.length; start += maxBatchSize) {
    const values = texts.slice(start, start + maxBatchSize);
    const result = await embedMany({
      model,
      values,
      dimensions: EMBEDDING_DIMENSIONS,
      maxRetries: 2,
    }).catch((cause: unknown) => {
      const message = `Embedding request to ${modelId} failed`;
      throw new AppError({ code: "INTERNAL", message, cause });
    });
    embeddings.push(
      ...checkVectors({ vectors: result.embeddings, modelId, expected: values.length }),
    );
  }
  return { model: modelId, embeddings };
}
