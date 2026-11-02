import { toast } from "@bibi/ui";
import type { ActionError, ActionResult } from "./action-result";
import { type ErrorKey, errorKeyForCode } from "./error-key";
import { submitWithToast, type ToastMessages } from "./submit-with-toast";

export type ActionWithToastInput<R> = {
  action: () => Promise<ActionResult<R>>;
  messages: ToastMessages<R>;
  /** `errors.*` key → localized text. */
  translate: (input: { key: ErrorKey }) => string;
  /** The error toast's text instead of the code's, when it returns one. */
  errorMessage?: (input: { error: ActionError }) => string | null;
};

const NETWORK: ActionResult<never> = {
  ok: false,
  error: { code: "INTERNAL", message: "Network error", issues: [] },
};

/**
 * A server action inside the one-toast-per-process flow. A thrown call (offline, server down)
 * becomes the `network` error toast instead of an unhandled rejection.
 */
export async function actionWithToast<R>({
  action,
  messages,
  translate,
  errorMessage,
}: ActionWithToastInput<R>): Promise<ActionResult<R>> {
  let result: ActionResult<R> = NETWORK;
  await submitWithToast({
    toast,
    messages,
    run: async () => {
      try {
        result = await action();
      } catch {
        return { ok: false, message: translate({ key: "network" }) };
      }
      if (result.ok) return { ok: true, value: result.value };
      const { error } = result;
      const own = errorMessage?.({ error }) ?? null;
      return {
        ok: false,
        message: own ?? translate({ key: errorKeyForCode({ code: error.code }) }),
      };
    },
  });
  return result;
}
