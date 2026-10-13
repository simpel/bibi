import { getEnv } from "@okazi/config";
import { createGateway, type LanguageModel } from "ai";

export type DefaultLanguageModelInput = { modelId?: string };

/**
 * The assistant's model through the Vercel AI Gateway: a plain id like
 * `anthropic/claude-sonnet-5-5` (`AI_DEFAULT_MODEL`), key `AI_GATEWAY_API_KEY` from config.
 */
export function defaultLanguageModel({ modelId }: DefaultLanguageModelInput = {}): LanguageModel {
  const env = getEnv();
  const gateway = createGateway({ apiKey: env.AI_GATEWAY_API_KEY });
  return gateway(modelId ?? env.AI_DEFAULT_MODEL);
}
