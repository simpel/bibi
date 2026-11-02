import { useEffect, useState } from "react";
import { readDraft, writeDraft } from "./draft-storage";
import type { IntakeState } from "./intake-state";

export type UseIntakeDraftInput = {
  /** Per organization and member (`draftKey`). */
  key: string;
  state: IntakeState;
  onRestore: (input: { state: IntakeState }) => void;
};

/**
 * The unfinished intake kept in this browser (spec "Local draft"). A stored draft is offered
 * while step 1 is still empty; until it is continued or discarded it is not overwritten, and
 * choosing a customer instead drops the offer. Storage runs only in the browser, after mount.
 */
export function useIntakeDraft({ key, state, onRestore }: UseIntakeDraftInput) {
  const [offer, setOffer] = useState<IntakeState | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setOffer(readDraft({ key }));
    setLoaded(true);
  }, [key]);
  const pending = state.who === null ? offer : null;
  useEffect(() => {
    if (loaded && pending === null) writeDraft({ key, state });
  }, [key, state, loaded, pending]);
  const continueDraft = () => {
    if (offer) onRestore({ state: offer });
    setOffer(null);
  };
  return { offer: pending, continueDraft, discardDraft: () => setOffer(null) };
}
