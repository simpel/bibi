import { EMBEDDING_DIMENSIONS } from "@bibi/db";
import type { EmbedFn } from "../../src/index";
import { fakeEmbed } from "../fake-embed";

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/embeddings";

type GatewayResponse = { data: { index: number; embedding: number[] }[] };

type RealEmbedInput = { apiKey: string; model: string };

function gatewayEmbed({ apiKey, model }: RealEmbedInput): EmbedFn {
  return async ({ texts }) => {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: texts, dimensions: EMBEDDING_DIMENSIONS }),
    });
    if (!response.ok) throw new Error(`Embedding request failed: ${response.status}`);
    const body = (await response.json()) as GatewayResponse;
    const sorted = [...body.data].sort((a, b) => a.index - b.index);
    return { model, embeddings: sorted.map((row) => row.embedding) };
  };
}

export type RelevanceEmbed = { embed: EmbedFn; real: boolean };

/**
 * Hash variant (default, runs in `pnpm test`) or a real model through the AI Gateway when
 * `RELEVANCE_GATEWAY_KEY` and `RELEVANCE_EMBEDDING_MODEL` are set (manual/nightly only).
 */
export function relevanceEmbed(): RelevanceEmbed {
  const apiKey = process.env.RELEVANCE_GATEWAY_KEY;
  const model = process.env.RELEVANCE_EMBEDDING_MODEL;
  if (apiKey && model) return { embed: gatewayEmbed({ apiKey, model }), real: true };
  return { embed: fakeEmbed, real: false };
}
