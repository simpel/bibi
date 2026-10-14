import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { ActionError, ActionResult } from "./action-result";
import { actionWithToast } from "./action-with-toast";

export type FormActionMessages = {
  /** Shown while the server action runs, e.g. "Sparar…". */
  pending: string;
  /** Replaces the pending toast on success, e.g. "Sparat". */
  success: string;
};

/**
 * `V` = raw form values, `T` = what the resolver outputs (e.g. core input after
 * `formSchema({ schema, toInput })`); the action receives `T`.
 */
export type UseFormActionInput<V extends FieldValues, R, T = V> = {
  form: UseFormReturn<V, unknown, T>;
  action: (input: { values: T }) => Promise<ActionResult<R>>;
  messages: FormActionMessages;
  onSuccess?: (input: { value: R; values: T }) => void;
  /** After the error toast, e.g. to restore the previous value of an auto-saving field. */
  onError?: (input: { error: ActionError; values: T }) => void;
};

type ApplyIssuesInput<V extends FieldValues, T> = {
  form: UseFormReturn<V, unknown, T>;
  error: ActionError;
  message: string;
};

/** Server-side field issues (`path` = field name) end up on the fields as `FormMessage`s. */
function applyIssues<V extends FieldValues, T>({
  form,
  error,
  message,
}: ApplyIssuesInput<V, T>): void {
  const fields = Object.keys(form.getValues());
  for (const issue of error.issues) {
    if (fields.includes(issue.path)) form.setError(issue.path as FieldPath<V>, { message });
  }
}

/**
 * THE way a form talks to a server action (CLAUDE.md "Forms"): client validation via the
 * form's resolver, then one toast per submit (loading → success, or a persistent error with a
 * close button) and server field issues on the fields.
 */
export function useFormAction<V extends FieldValues, R, T = V>({
  form,
  action,
  messages,
  onSuccess,
  onError,
}: UseFormActionInput<V, R, T>) {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const run = ({ values }: { values: T }) => {
    startTransition(async () => {
      const translate = ({ key }: { key: Parameters<typeof t>[0] }) => t(key);
      const result = await actionWithToast({
        action: () => action({ values }),
        messages,
        translate,
      });
      if (result.ok) {
        onSuccess?.({ value: result.value, values });
        return;
      }
      applyIssues({ form, error: result.error, message: t("invalid") });
      onError?.({ error: result.error, values });
    });
  };
  return { submit: form.handleSubmit((values) => run({ values })), run, pending };
}
