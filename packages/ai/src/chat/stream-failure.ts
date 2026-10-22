import { getLogContext, getLogger, runWithLogContext } from "@bibi/logger";

/** What the user sees; the real cause only goes to the system log. */
export const SAFE_ERROR = "The assistant could not finish the answer. Please try again.";

export type StreamFailureInput = { modelId: string };

/**
 * `onError` for the UI stream: logs the cause (e.g. the gateway rejecting an unknown model) as
 * `ai.streamFailed` at error level in the request's log context, and returns the safe text.
 * Stream callbacks run after the response returned, hence the captured context.
 */
export function streamFailure({ modelId }: StreamFailureInput): (error: unknown) => string {
  const context = getLogContext() ?? {};
  return (error) => {
    runWithLogContext({
      context,
      fn: () => getLogger().error({ event: "ai.streamFailed", model: modelId, err: error }),
    });
    return SAFE_ERROR;
  };
}
