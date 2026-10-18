import type { PipelinePreview, PipelineSetupDraft } from "@okazi/core/schemas";
import { useCallback, useState, useTransition } from "react";
import type { UseFormReturn } from "react-hook-form";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { previewPipelineSetupAction } from "../actions";
import { pipelineSetupFormSchema, type SetupFormValues } from "./setup-form-schema";

export type PreviewState = {
  preview: PipelinePreview | null;
  /** The draft does not pass the form's own validation yet. */
  invalid: boolean;
  errorKey: ErrorKey | null;
};

const EMPTY: PreviewState = { preview: null, invalid: false, errorKey: null };

export type UsePipelinePreviewInput = {
  form: UseFormReturn<SetupFormValues, unknown, PipelineSetupDraft>;
};

/** Runs `pipelineSetup.preview` for the form's current draft; nothing is saved. */
export function usePipelinePreview({ form }: UsePipelinePreviewInput) {
  const [state, setState] = useState<PreviewState>(EMPTY);
  const [pending, startTransition] = useTransition();
  const refresh = useCallback(() => {
    startTransition(async () => {
      const parsed = pipelineSetupFormSchema.safeParse(form.getValues());
      if (!parsed.success) {
        setState({ ...EMPTY, invalid: true });
        return;
      }
      try {
        const result = await previewPipelineSetupAction({ input: parsed.data });
        setState(
          result.ok
            ? { ...EMPTY, preview: result.value }
            : { ...EMPTY, errorKey: errorKeyForCode({ code: result.error.code }) },
        );
      } catch {
        setState({ ...EMPTY, errorKey: "network" });
      }
    });
  }, [form]);
  return { ...state, pending, refresh };
}
