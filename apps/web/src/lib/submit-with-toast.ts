import type { ActionResult } from "./action-result";
import { type ErrorKey, errorKeyForCode } from "./error-key";

/** The slice of sonner's `toast` the form flow uses (injectable for tests). */
export type ToastApi = {
  loading: (message: string) => string | number;
  success: (message: string, options: { id: string | number }) => unknown;
  error: (
    message: string,
    options: { id: string | number; duration: number; closeButton: boolean },
  ) => unknown;
};

export type SubmitWithToastInput<R> = {
  toast: ToastApi;
  run: () => Promise<ActionResult<R>>;
  /** `success` can be built from the result, e.g. "3 roles created". */
  messages: { pending: string; success: string | ((input: { value: R }) => string) };
  /** `errors.*` key → text. */
  translate: (input: { key: ErrorKey }) => string;
};

/**
 * One process, one toast id: loading → success, or a persistent error with a close button
 * (CLAUDE.md "Formulär"). Returns the result so callers can react (field errors, restore).
 */
export async function submitWithToast<R>({
  toast,
  run,
  messages,
  translate,
}: SubmitWithToastInput<R>): Promise<ActionResult<R>> {
  const id = toast.loading(messages.pending);
  const result = await run();
  if (result.ok) {
    const { success } = messages;
    const text = typeof success === "string" ? success : success({ value: result.value });
    toast.success(text, { id });
    return result;
  }
  const text = translate({ key: errorKeyForCode({ code: result.error.code }) });
  toast.error(text, { id, duration: Number.POSITIVE_INFINITY, closeButton: true });
  return result;
}
