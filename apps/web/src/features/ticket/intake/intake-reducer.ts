import {
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

/** Step 3 done: the review starts, or keeps its notes and answers with the new lines. */
function complete({ state, action }: CompleteInput): IntakeState {
  if (!state.pick) return state;
  const pickKey = state.pick.kind === "ONE_OFF" ? "ONE_OFF" : state.pick.templateId;
  const { lines, plannedStart } = action;
  const review = state.review
    ? { ...state.review, lines, plannedStart, pickKey }
    : { ...newReview({ lines, plannedStart, pickKey }), note: state.draft?.note ?? "" };
  const next = { ...state, review };
  return { ...next, open: nextOpen({ state: next }) };
}

type DraftInput = { state: IntakeState; action: Extract<IntakeAction, { type: "applyDraft" }> };

/** What was read fills steps 1–2 when complete; the first step still open takes input. */
function withDraft({ state, action }: DraftInput): IntakeState {
  const next = {
    ...state,
    who: action.who ?? state.who,
    when: action.when ?? state.when,
    draft: action.draft,
  };
  return { ...next, open: nextOpen({ state: next }) };
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
    case "openMessage":
      return { ...state, open: "message" };
    case "skipMessage":
      return { ...state, open: nextOpen({ state }) };
    case "applyDraft":
      return withDraft({ state, action });
  }
}
