import {
  hasChoices,
  hasValue,
  INTAKE_STEPS,
  type IntakeState,
  type IntakeStep,
} from "./intake-state";

export type OpenableStepInput = {
  state: IntakeState;
  /** The step asked for (the URL's). */
  step: IntakeStep;
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
 * built (step 3 done).
 */
export function openableStep({ state, step }: OpenableStepInput): IntakeStep {
  if (step === "who") return "who";
  if (step === "review") return state.review ? "review" : firstMissing({ state });
  // ADR 0089: only while the review has lines to ask.
  if (step === "choices") {
    if (hasChoices({ state })) return "choices";
    return state.review ? "review" : firstMissing({ state });
  }
  const index = INTAKE_STEPS.indexOf(step);
  const before = INTAKE_STEPS.slice(0, index);
  return before.every((earlier) => hasValue({ state, step: earlier }))
    ? step
    : firstMissing({ state });
}

export type EntryInput = {
  /** The step the URL named on load (`who` for `/new/ticket` and `/new/ticket/message`). */
  urlStep: IntakeStep;
  /** Opened from an inbox message (`?fromMessage=`), whose draft is kept apart. */
  hasMessage: boolean;
};

/**
 * A stored draft is restored without asking when the URL goes past the start, or when the page
 * is an inbox message's (its draft is that message's own). Plain `/new/ticket` offers it.
 */
export function restoresDraft({ urlStep, hasMessage }: EntryInput): boolean {
  return hasMessage || urlStep !== "who";
}

export type RestoredInput = EntryInput & { stored: IntakeState };

/** A restored draft opens the URL's step if it can; a bare message link keeps the draft's own. */
export function restoredStep({ stored, urlStep, hasMessage }: RestoredInput): IntakeStep {
  const step = hasMessage && urlStep === "who" ? stored.open : urlStep;
  return openableStep({ state: stored, step });
}

const PREVIOUS: Record<IntakeStep, IntakeStep | null> = {
  who: null,
  when: "who",
  package: "when",
  choices: "package",
  review: "package",
};

export type PreviousStepInput = { state: IntakeState; step: IntakeStep };

/**
 * What a step's Back opens (step 1 has none); like Change there, later answers are kept. Review
 * goes back to the choices step when the intake has one (ADR 0089).
 */
export function previousStep({ state, step }: PreviousStepInput): IntakeStep | null {
  if (step === "review" && hasChoices({ state })) return "choices";
  return PREVIOUS[step];
}
