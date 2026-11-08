import type { AppErrorIssue } from "@bibi/core";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";
import { type SaveChange, useConfirmSave } from "@/components/save-confirm/save-confirm-context";
import type { ActionError, ActionResult } from "./action-result";
import { actionWithToast } from "./action-with-toast";
import { isFormPath } from "./issue-form-path";

export type FormActionMessages = {
  /** Shown while the server action runs, e.g. "Sparar…". */
  pending: string;
  /** Replaces the pending toast on success, e.g. "Sparat". */
  success: string;
  /**
   * The error toast when the server's validation issues name no field of the form; default
   * `errors.validationUnmapped` with the server's message.
   */
  unmapped?: string;
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
  /** Server issues whose path is no field of the form, for the form to show them itself. */
  onUnmappedIssues?: (input: { issues: AppErrorIssue[] }) => void;
  /** The change as the user reads it; inside a `SaveConfirmProvider` it is confirmed first. */
  confirm?: ((input: { values: T }) => SaveChange[]) | undefined;
};

type SplitInput = { error: ActionError; values: FieldValues };

/** The error's issues on a field of the form, and the rest. */
function splitIssues({ error, values }: SplitInput) {
  const mapped = error.issues.filter(({ path }) => isFormPath({ path, values }));
  const unmapped = error.issues.filter(({ path }) => !isFormPath({ path, values }));
  return { mapped, unmapped };
}

/**
 * THE way a form talks to a server action (CLAUDE.md "Forms"): client validation via the
 * form's resolver, then one toast per submit (loading → success, or a persistent error with a
 * close button) and server field issues on the fields. A validation error that names no field
 * does not claim highlighted fields: its toast says what failed, and `onUnmappedIssues` gets it.
 */
export function useFormAction<V extends FieldValues, R, T = V>({
  form,
  action,
  messages,
  onSuccess,
  onError,
  onUnmappedIssues,
  confirm,
}: UseFormActionInput<V, R, T>) {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const errorMessage = ({ error }: { error: ActionError }) => {
    if (error.code !== "VALIDATION") return null;
    if (splitIssues({ error, values: form.getValues() }).mapped.length > 0) return null;
    return messages.unmapped ?? t("validationUnmapped", { message: error.message });
  };
  const ask = useConfirmSave();
  const save = ({ values }: { values: T }) => {
    startTransition(async () => {
      const translate = ({ key }: { key: Parameters<typeof t>[0] }) => t(key);
      const result = await actionWithToast({
        ...{ action: () => action({ values }), messages, translate, errorMessage },
      });
      if (result.ok) {
        onSuccess?.({ value: result.value, values });
        return;
      }
      const { mapped, unmapped } = splitIssues({ error: result.error, values: form.getValues() });
      for (const issue of mapped)
        form.setError(issue.path as FieldPath<V>, { message: t("invalid") });
      if (unmapped.length > 0) onUnmappedIssues?.({ issues: unmapped });
      onError?.({ error: result.error, values });
    });
  };
  const run = ({ values }: { values: T }) => {
    const changes = confirm?.({ values }) ?? [];
    if (!ask || changes.length === 0) return save({ values });
    void ask({ changes }).then((ok) => (ok ? save({ values }) : undefined));
  };
  return { submit: form.handleSubmit((values) => run({ values })), run, pending };
}
