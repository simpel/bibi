import type { ArchivePreview } from "@okazi/core/schemas";
import { useEffect, useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";

type State = { preview: ArchivePreview | null; errorKey: ErrorKey | null; loading: boolean };

export type UseArchivePreviewInput = {
  /** Loads the preview for the current form values. */
  load: () => Promise<ActionResult<ArchivePreview>>;
  /** Changes whenever the preview must be loaded again (the chosen target and reason). */
  inputKey: string;
};

const DEBOUNCE_MS = 250;

/** Loads a dry-run preview of an archive whenever the form's input changes; nothing is saved. */
export function useArchivePreview({ load, inputKey }: UseArchivePreviewInput) {
  const [state, setState] = useState<State>({ preview: null, errorKey: null, loading: true });
  // biome-ignore lint/correctness/useExhaustiveDependencies: `inputKey` stands for `load`'s input
  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const result = await load();
        if (cancelled) return;
        setState(
          result.ok
            ? { preview: result.value, errorKey: null, loading: false }
            : {
                preview: null,
                errorKey: errorKeyForCode({ code: result.error.code }),
                loading: false,
              },
        );
      } catch {
        if (!cancelled) setState({ preview: null, errorKey: "network", loading: false });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputKey]);
  return state;
}
