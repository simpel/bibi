import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { type SaveChange, useConfirmSave } from "@/components/save-confirm/save-confirm-context";
import type { ActionResult } from "./action-result";
import { actionWithToast } from "./action-with-toast";
import type { ToastMessages } from "./submit-with-toast";

export type RunToastActionInput<R> = {
  action: () => Promise<ActionResult<R>>;
  messages: ToastMessages<R>;
  onSuccess?: (input: { value: R }) => void;
  /** After the error toast, e.g. to put an auto-saved field back. */
  onError?: () => void;
  /** The change as the user reads it; inside a `SaveConfirmProvider` it is confirmed first. */
  confirm?: SaveChange[] | undefined;
};

/**
 * Server actions without form fields (archive, publish, share, …) in the same one-toast flow as
 * `useFormAction` (CLAUDE.md "Forms"). `pending` disables the triggering button.
 */
export function useToastAction() {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const ask = useConfirmSave();
  const run = <R>({ action, messages, onSuccess, onError, confirm }: RunToastActionInput<R>) => {
    const go = () =>
      startTransition(async () => {
        const translate = ({ key }: { key: Parameters<typeof t>[0] }) => t(key);
        const result = await actionWithToast({ action, messages, translate });
        if (result.ok) onSuccess?.({ value: result.value });
        else onError?.();
      });
    if (!ask || !confirm) return go();
    void ask({ changes: confirm }).then((confirmed) => (confirmed ? go() : onError?.()));
  };
  return { run, pending };
}
