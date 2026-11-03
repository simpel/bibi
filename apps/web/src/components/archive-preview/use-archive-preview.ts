import type { ArchivePreview } from "@bibi/core/schemas";
import type { ActionResult } from "@/lib/action-result";
import type { ErrorKey } from "@/lib/error-key";
import { useLiveQuery } from "@/lib/use-live-query";

type State = { preview: ArchivePreview | null; errorKey: ErrorKey | null; loading: boolean };

export type UseArchivePreviewInput = {
  /** Loads the preview for the current form values. */
  load: () => Promise<ActionResult<ArchivePreview>>;
  /** Changes whenever the preview must be loaded again (the chosen target and reason). */
  inputKey: string;
};

const DEBOUNCE_MS = 250;

/** Loads a dry-run preview of an archive whenever the form's input changes; nothing is saved. */
export function useArchivePreview({ load, inputKey }: UseArchivePreviewInput): State {
  const state = useLiveQuery({ input: { inputKey }, load: () => load(), waitMs: DEBOUNCE_MS });
  if (state.status === "ready") return { preview: state.value, errorKey: null, loading: false };
  if (state.status === "error") return { preview: null, errorKey: state.errorKey, loading: false };
  const preview = state.status === "loading" ? state.previous : null;
  return { preview, errorKey: null, loading: true };
}
