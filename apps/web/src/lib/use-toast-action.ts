import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { ActionResult } from "./action-result";
import { actionWithToast } from "./action-with-toast";
import type { ToastMessages } from "./submit-with-toast";

export type RunToastActionInput<R> = {
  action: () => Promise<ActionResult<R>>;
  messages: ToastMessages<R>;
  onSuccess?: (input: { value: R }) => void;
};

/**
 * Server actions without form fields (archive, publish, share, …) in the same one-toast flow as
 * `useFormAction` (CLAUDE.md "Formulär"). `pending` disables the triggering button.
 */
export function useToastAction() {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const run = <R>({ action, messages, onSuccess }: RunToastActionInput<R>) => {
    startTransition(async () => {
      const translate = ({ key }: { key: Parameters<typeof t>[0] }) => t(key);
      const result = await actionWithToast({ action, messages, translate });
      if (result.ok) onSuccess?.({ value: result.value });
    });
  };
  return { run, pending };
}
