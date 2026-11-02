import {
  hasValue,
  INITIAL_INTAKE,
  INTAKE_STEPS,
  type IntakeAction,
  type IntakeState,
  type IntakeStep,
  type IntakeWhen,
} from "./intake-state";

/** The first step without an answer, or review when all have one. */
function nextOpen({ state }: { state: IntakeState }): IntakeStep {
  return INTAKE_STEPS.find((step) => !hasValue({ state, step })) ?? "review";
}

const sameWhen = ({ a, b }: { a: IntakeWhen | null; b: IntakeWhen }) =>
  a !== null && a.date === b.date && a.from === b.from && a.to === b.to && a.guests === b.guests;

/** A changed period or headcount voids a package's answers; a one-off is kept. */
function withWhen({ state, when }: { state: IntakeState; when: IntakeWhen }): IntakeState {
  const keepPick = sameWhen({ a: state.when, b: when }) || state.pick?.kind !== "PACKAGE";
  const next = { ...state, when, pick: keepPick ? state.pick : null };
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
      return state.pick ? { ...state, open: nextOpen({ state }) } : state;
    case "change":
      return { ...state, open: action.step };
    case "restore":
      return action.state;
    case "reset":
      return INITIAL_INTAKE;
  }
}
