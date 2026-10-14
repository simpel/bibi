/** The slice of sonner's `toast` the form flow uses (injectable for tests). */
export type ToastApi = {
  loading: (message: string) => string | number;
  success: (message: string, options: { id: string | number }) => unknown;
  error: (
    message: string,
    options: { id: string | number; duration: number; closeButton: boolean },
  ) => unknown;
};

/** Outcome of one process; `message` is the already localized error text. */
export type ToastOutcome<R> = { ok: true; value: R } | { ok: false; message: string };

/** `success` can be built from the result, e.g. "3 roles created". */
export type ToastMessages<R> = {
  pending: string;
  success: string | ((input: { value: R }) => string);
};

export type SubmitWithToastInput<R> = {
  toast: ToastApi;
  run: () => Promise<ToastOutcome<R>>;
  messages: ToastMessages<R>;
};

/**
 * One process, one toast id: loading → success, or a persistent error with a close button
 * (CLAUDE.md "Formulär"). Shared by server actions (`useFormAction`, `useToastAction`) and
 * Better Auth client calls (`useAuthFormAction`), which differ only in how errors are worded.
 */
export async function submitWithToast<R>({
  toast,
  run,
  messages,
}: SubmitWithToastInput<R>): Promise<ToastOutcome<R>> {
  const id = toast.loading(messages.pending);
  const outcome = await run();
  if (outcome.ok) {
    const { success } = messages;
    const text = typeof success === "string" ? success : success({ value: outcome.value });
    toast.success(text, { id });
    return outcome;
  }
  toast.error(outcome.message, { id, duration: Number.POSITIVE_INFINITY, closeButton: true });
  return outcome;
}
