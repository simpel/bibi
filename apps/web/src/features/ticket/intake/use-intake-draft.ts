import { useEffect, useState } from "react";
import { readDraft, writeDraft } from "./draft-storage";
import type { IntakeState } from "./intake-state";

export type RestoreInput = {
  state: IntakeState;
  /** Restored without asking (a reload past the start), not by Continue. */
  auto: boolean;
};

export type UseIntakeDraftInput = {
  /** Per organization and member (`draftKey`). */
  key: string;
  state: IntakeState;
  /** Restore a stored draft at once instead of offering it (`restoresDraft`). */
  autoRestore: boolean;
  onRestore: (input: RestoreInput) => void;
};

/**
 * The unfinished intake kept in this browser (spec "Local draft"). On load a stored draft is
 * restored at once when `autoRestore`, else offered while step 1 is still empty; until it is
 * continued or discarded it is not overwritten, and choosing a customer instead drops the offer.
 * Every state change after that is written right away. Storage runs only in the browser.
 */
export function useIntakeDraft({ key, state, autoRestore, onRestore }: UseIntakeDraftInput) {
  const [offer, setOffer] = useState<IntakeState | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const stored = readDraft({ key });
    if (stored && autoRestore) onRestore({ state: stored, auto: true });
    else setOffer(stored);
    setLoaded(true);
  }, [key, autoRestore, onRestore]);
  const pending = state.who === null ? offer : null;
  useEffect(() => {
    if (loaded && pending === null) writeDraft({ key, state });
  }, [key, state, loaded, pending]);
  const continueDraft = () => {
    if (offer) onRestore({ state: offer, auto: false });
    setOffer(null);
  };
  return { loaded, offer: pending, continueDraft, discardDraft: () => setOffer(null) };
}

export type IntakeDraft = ReturnType<typeof useIntakeDraft>;
