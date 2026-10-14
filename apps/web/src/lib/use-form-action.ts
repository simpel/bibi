import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import type { ActionError, ActionResult } from "./action-result";
import { submitWithToast } from "./submit-with-toast";

export type FormActionMessages = {
  /** Shown while the server action runs, e.g. "Sparar…". */
  pending: string;
  /** Replaces the pending toast on success, e.g. "Sparat". */
  success: string;
};

export type UseFormActionInput<V extends FieldValues, R> = {
  form: UseFormReturn<V>;
  action: (input: { values: V }) => Promise<ActionResult<R>>;
  messages: FormActionMessages;
  onSuccess?: (input: { value: R; values: V }) => void;
  /** After the error toast, e.g. to restore the previous value of an auto-saving field. */
  onError?: (input: { error: ActionError; values: V }) => void;
};

type ApplyIssuesInput<V extends FieldValues> = {
  form: UseFormReturn<V>;
  error: ActionError;
  message: string;
};

/** Server-side field issues (`path` = field name) end up on the fields as `FormMessage`s. */
function applyIssues<V extends FieldValues>({ form, error, message }: ApplyIssuesInput<V>): void {
  const fields = Object.keys(form.getValues());
  for (const issue of error.issues) {
    if (fields.includes(issue.path)) form.setError(issue.path as FieldPath<V>, { message });
  }
}

/**
 * THE way a form talks to a server action (see CLAUDE.md "Formulär"): client validation via the
 * form's resolver, then ONE toast per submit (`submitWithToast`) — loading → success, or a persistent error with a
 * close button — all sharing one toast id.
 */
export function useFormAction<V extends FieldValues, R>({
  form,
  action,
  messages,
  onSuccess,
  onError,
}: UseFormActionInput<V, R>) {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const run = ({ values }: { values: V }) => {
    startTransition(async () => {
      const result = await submitWithToast({
        toast,
        run: () => action({ values }),
        messages,
        translate: ({ key }) => t(key),
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
