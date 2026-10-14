import { toast } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import type { ActionResult } from "./action-result";
import { type SubmitWithToastInput, submitWithToast } from "./submit-with-toast";

export type UseToastActionInput<R> = {
  action: () => Promise<ActionResult<R>>;
  messages: SubmitWithToastInput<R>["messages"];
  onSuccess?: (input: { value: R }) => void;
};

/**
 * `useFormAction` for actions without a form (archive confirmations, one-click buttons): the
 * same single toast per run — loading → success, or a persistent error (CLAUDE.md "Formulär").
 */
export function useToastAction<R>({ action, messages, onSuccess }: UseToastActionInput<R>) {
  const t = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const run = () => {
    startTransition(async () => {
      const result = await submitWithToast({
        toast,
        run: action,
        messages,
        translate: ({ key }) => t(key),
      });
      if (result.ok) onSuccess?.({ value: result.value });
    });
  };
  return { run, pending };
}
