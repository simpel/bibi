import { useCallback, useReducer, useState } from "react";
import type { IntakeData } from "../load-intake-data";
import type { IntakeMessage } from "./intake-message";
import { reduceIntake } from "./intake-reducer";
import {
  type IntakeAction,
  type IntakeState,
  type IntakeStep,
  initialIntake,
} from "./intake-state";
import { restoredStep, restoresDraft } from "./openable-step";
import { type RestoreInput, useIntakeDraft } from "./use-intake-draft";
import { useStepUrl } from "./use-step-url";

export type UseIntakeFlowInput = {
  data: IntakeData;
  message: IntakeMessage | null;
  /** The step the URL named when the page loaded. */
  urlStep: IntakeStep;
  /** The paste dialog is open: the URL waits for it (`useStepUrl`). */
  pasting: boolean;
};

/**
 * The intake's one reducer with its local draft and its step in the URL (spec "The page"). A
 * load past the start restores the draft on the URL's step (or the first one still missing
 * input); plain `/new/ticket` offers it as before.
 */
export function useIntakeFlow({ data, message, urlStep, pasting }: UseIntakeFlowInput) {
  const [entry] = useState(() => ({ urlStep, hasMessage: message !== null }));
  const [state, dispatch] = useReducer(
    (current: IntakeState, action: IntakeAction) => reduceIntake({ state: current, action }),
    undefined,
    () => initialIntake({ intakeKey: crypto.randomUUID(), inboundMessageId: message?.id ?? null }),
  );
  const onRestore = useCallback(
    ({ state: stored, auto }: RestoreInput) => {
      const open = auto ? restoredStep({ ...entry, stored }) : stored.open;
      dispatch({ type: "restore", state: { ...stored, open } });
    },
    [entry],
  );
  const draft = useIntakeDraft({
    key: data.draftKey,
    state,
    autoRestore: restoresDraft(entry),
    onRestore,
  });
  useStepUrl({ state, dispatch, ready: draft.loaded, hold: pasting });
  return { state, dispatch, draft };
}
