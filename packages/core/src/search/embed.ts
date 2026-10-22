export type EmbedInput = { texts: readonly string[] };

export type EmbedOutput = {
  /** Model id stored with each row so re-embedding on model change is detectable. */
  model: string;
  /** One 1536-dimension vector per input text, same order. */
  embeddings: number[][];
};

/** Injected by the app (AI SDK lives in @bibi/ai); core never calls a provider directly. */
export type EmbedFn = (input: EmbedInput) => Promise<EmbedOutput>;
