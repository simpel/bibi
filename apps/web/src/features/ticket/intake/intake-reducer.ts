import {
  hasChoices,
  hasValue,
  INTAKE_STEPS,
  type IntakeAction,
  type IntakeState,
  type IntakeStep,
  type IntakeWhen,
  initialIntake,
} from "./intake-state";
import { newReview } from "./review-state";

/** The first step without an answer, or review when all have one. */
function nextOpen({ state }: { state: IntakeState }): IntakeStep {
  return INTAKE_STEPS.find((step) => !hasValue({ state, step })) ?? "review";
}

const sameWhen = ({ a, b }: { a: IntakeWhen | null; b: IntakeWhen }) =>
  a !== null && a.date === b.date && a.from === b.from && a.to === b.to && a.guests === b.guests;

/**
 * A changed period or headcount voids a package's answers before the review exists; once lines
 * were built they stay, and the review asks what happens to them (`open-questions.ts`).
 */
function withWhen({ state, when }: { state: IntakeState; when: IntakeWhen }): IntakeState {
  const keepPick =
    sameWhen({ a: state.when, b: when }) || state.pick?.kind !== "PACKAGE" || state.review !== null;
  const next = { ...state, when, pick: keepPick ? state.pick : null };
  return { ...next, open: nextOpen({ state: next }) };
}

type CompleteInput = {
  state: IntakeState;
  action: Extract<IntakeAction, { type: "completePackage" }>;
};

/**
 * Step 3 done: the review starts, or keeps its notes and answers with the new lines. New lines
 * with a required choice open the choices step first (ADR 0089); the same lines again go back
 * to review.
 */
function complete({ state, action }: CompleteInput): IntakeState {
  if (!state.pick) return state;
  const pickKey = state.pick.kind === "ONE_OFF" ? "ONE_OFF" : state.pick.templateId;
  const { lines, plannedStart, choiceKeys } = action;
  const fresh = state.review?.pickKey !== pickKey;
  const keys = fresh ? choiceKeys : (state.review?.choiceKeys ?? []);
  const review = state.review
    ? { ...state.review, lines, plannedStart, pickKey, choiceKeys: keys }
    : {
        ...newReview({ lines, plannedStart, pickKey, choiceKeys: keys }),
        note: state.draft?.note ?? "",
      };
  const next = { ...state, review };
  const open = fresh && hasChoices({ state: next }) ? "choices" : nextOpen({ state: next });
  return { ...next, open };
}

export type ReduceIntakeInput = { state: IntakeState; action: IntakeAction };

/**
 * The intake page's state (spec "The page"): one open step, done steps keep their answers when
 * an earlier one is changed, and completing a step opens the first one still without an answer.
 */
export function reduceIntake({ state, action }: ReduceIntakeInput): IntakeState {
  switch (action.type) {
    case "setWho": {
      const next = { ...state, who: action.who };
      return { ...next, open: nextOpen({ state: next }) };
    }
    case "setWhen":
      return withWhen({ state, when: action.when });
    case "pick":
      return { ...state, pick: action.pick, when: action.when ?? state.when, open: "package" };
    case "unpick":
      return { ...state, pick: null };
    case "completePackage":
      return complete({ state, action });
    case "patchReview":
      return state.review ? { ...state, review: { ...state.review, ...action.patch } } : state;
    case "change":
      return { ...state, open: action.step };
    case "restore":
      return action.state;
    case "reset":
      return initialIntake({ intakeKey: action.intakeKey });
    case "applyDraft":
      // Prefilled, not completed: the steps start over from the read and open at step 1.
      return {
        ...{ ...state, who: null, when: null, pick: null, review: null },
        ...{ draft: action.draft, open: "who" },
      };
  }
}
