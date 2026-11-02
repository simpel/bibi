import { hasValue, INTAKE_STEPS, type IntakeState, type IntakeStep } from "./intake-state";

export type OpenableStepInput = {
  state: IntakeState;
  /** The step asked for (the URL's). */
  step: IntakeStep;
  /** Step 0 exists: drafting from a message has a model (ADR 0084). */
  messageEnabled: boolean;
};

/** The first input step still without an answer; with all answered, review once it exists. */
function firstMissing({ state }: { state: IntakeState }): IntakeStep {
  const missing = INTAKE_STEPS.find((step) => !hasValue({ state, step }));
  if (missing) return missing;
  return state.review ? "review" : "package";
}

/**
 * The step the intake can open for a URL (spec "The page"): the asked step when every earlier
 * step has its answer, otherwise the first step still missing input. Review needs its lines
 * built (step 3 done), step 0 needs a drafting model.
 */
export function openableStep({ state, step, messageEnabled }: OpenableStepInput): IntakeStep {
  if (step === "message") return messageEnabled ? "message" : firstMissing({ state });
  if (step === "who") return "who";
  if (step === "review") return state.review ? "review" : firstMissing({ state });
  const index = INTAKE_STEPS.indexOf(step);
  const before = INTAKE_STEPS.slice(0, index);
  return before.every((earlier) => hasValue({ state, step: earlier }))
    ? step
    : firstMissing({ state });
}

export type EntryInput = {
  /** The step the URL named on load. */
  urlStep: IntakeStep;
  /** Opened from an inbox message (`?fromMessage=`), whose draft is kept apart. */
  hasMessage: boolean;
  messageEnabled: boolean;
};

/**
 * A stored draft is restored without asking when the URL goes past the start, or when the page
 * is an inbox message's (its draft is that message's own). Plain `/new/ticket` offers it.
 */
export function restoresDraft({ urlStep, hasMessage }: Omit<EntryInput, "messageEnabled">) {
  return hasMessage || (urlStep !== "who" && urlStep !== "message");
}

/** The step a fresh intake opens on: step 0 for `/message` or an inbox message, else step 1. */
export function entryStep({ urlStep, hasMessage, messageEnabled }: EntryInput): IntakeStep {
  if (!messageEnabled) return "who";
  return urlStep === "message" || (hasMessage && urlStep === "who") ? "message" : "who";
}

export type RestoredInput = EntryInput & { stored: IntakeState };

/** A restored draft opens the URL's step if it can; a bare message link keeps the draft's own. */
export function restoredStep({ stored, urlStep, hasMessage, messageEnabled }: RestoredInput) {
  const step = hasMessage && urlStep === "who" ? stored.open : urlStep;
  return openableStep({ state: stored, step, messageEnabled });
}
