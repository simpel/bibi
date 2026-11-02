import { getEnv } from "@bibi/config";
import { AppError, type ExtractFn, type ExtractInput, err, ok } from "@bibi/core";
import { getLogger } from "@bibi/logger";
import { generateText, type LanguageModel, Output } from "ai";
import { configuredLanguageModel } from "../chat/language-model";

/** Bounds of one reading: a draft is short, and staff wait for it. */
export const EXTRACT_LIMITS = { maxOutputTokens: 4096, totalTimeoutMs: 60_000 } as const;

const unavailable = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "UNAVAILABLE", message }) });

type RunInput = ExtractInput & { model: LanguageModel };

/** One `generateText` with structured output; any failure is UNAVAILABLE (the error name only is logged). */
async function run({ model, instructions, prompt, schema, feature, limits }: RunInput) {
  const bounds = limits ?? EXTRACT_LIMITS;
  try {
    const result = await generateText({
      model,
      instructions,
      prompt,
      output: Output.object({ schema }),
      maxOutputTokens: bounds.maxOutputTokens,
      timeout: { totalMs: bounds.totalTimeoutMs },
    });
    return ok({ value: result.output as unknown });
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    getLogger().warn({ event: "ai.extractFailed", feature, error: name });
    return unavailable({ message: "The model could not read the text" });
  }
}

export type CreateExtractInput = {
  /** Test and E2E seam (`MockLanguageModelV4`). Default: the model a superadmin chose (ADR 0015). */
  model?: LanguageModel;
  /** Override for tests; default from `@bibi/config`. `null` = no key. */
  apiKey?: string | null;
};

/**
 * The `extract` port injected into core (ADR 0084): AI SDK `generateText` with
 * `Output.object` through the AI Gateway, on the model chosen for the input's feature. Without
 * `AI_GATEWAY_API_KEY` or a chosen model every call is UNAVAILABLE: there is no placeholder for
 * reading text. Core parses the result with the schema again.
 */
export function createExtract({ model, apiKey }: CreateExtractInput = {}): ExtractFn {
  if (model) return (input) => run({ ...input, model });
  const key = apiKey === undefined ? getEnv().AI_GATEWAY_API_KEY : apiKey;
  if (!key) return async () => unavailable({ message: "AI_GATEWAY_API_KEY is not set" });
  return async (input) => {
    const chosen = await configuredLanguageModel({ feature: input.feature });
    if (!chosen.ok) return chosen;
    return run({ ...input, model: chosen.value.model });
  };
}

/**
 * The extractor an app injects with `setExtract`: `createExtract()`, or with `E2E_MOCK_MODEL` on
 * outside production the deterministic E2E draft model (loaded only then, keeping `ai/test` out).
 */
export function createAppExtract(): ExtractFn {
  const { E2E_MOCK_MODEL, NODE_ENV } = getEnv();
  if (!E2E_MOCK_MODEL || NODE_ENV === "production") return createExtract();
  let mock: Promise<ExtractFn> | undefined;
  return async (input) => {
    mock ??= import("./e2e-draft-model").then(({ createE2eDraftModel }) =>
      createExtract({ model: createE2eDraftModel() }),
    );
    return (await mock)(input);
  };
}
