/** The steps of the intake page in order; `review` is reached when every step has a value. */
export const INTAKE_STEPS = ["who", "when", "package"] as const;
export type InputStep = (typeof INTAKE_STEPS)[number];
export type IntakeStep = InputStep | "review";

/** Step 1: the customer and the contact person who asks. */
export type IntakeWho = {
  customerId: string;
  customerName: string;
  contactId: string;
  contactName: string;
};

/**
 * Step 2 as typed: a plain day and wall times in the organization's zone (ADR 0064). A `to` at
 * or before `from` ends the next day. Instants are derived at the edge (`intake-period.ts`).
 */
export type IntakeWhen = { date: string; from: string; to: string; guests: number };

/** What the follow-up dialog answered for a package (ADR 0081, spec "Picking a package"). */
export type FollowUpAnswers = {
  guests?: "CHANGE" | "KEEP";
  end?: "EXTEND" | "KEEP";
  clash?: "MOVE" | "PREBOOK";
};

/** Step 3: a package with its answers, or a one-off. */
export type IntakePick =
  | { kind: "ONE_OFF" }
  | { kind: "PACKAGE"; templateId: string; name: string; answers: FollowUpAnswers };

export type IntakeState = {
  /** The one step that takes input. */
  open: IntakeStep;
  who: IntakeWho | null;
  when: IntakeWhen | null;
  pick: IntakePick | null;
};

export const INITIAL_INTAKE: IntakeState = { open: "who", who: null, when: null, pick: null };

export type IntakeAction =
  | { type: "setWho"; who: IntakeWho }
  | { type: "setWhen"; when: IntakeWhen }
  /** A package picked with its answers applied to `when`, or a one-off; step 3 stays open. */
  | { type: "pick"; pick: IntakePick; when?: IntakeWhen }
  | { type: "unpick" }
  | { type: "completePackage" }
  | { type: "change"; step: InputStep }
  | { type: "restore"; state: IntakeState }
  | { type: "reset" };

type StepInput = { state: IntakeState; step: InputStep };

/** Whether the step has its answer. */
export function hasValue({ state, step }: StepInput): boolean {
  if (step === "who") return state.who !== null;
  if (step === "when") return state.when !== null;
  return state.pick !== null;
}

export type StepView = "open" | "done" | "locked";

/** How a step shows: the open one takes input, answered ones are done, the rest locked. */
export function stepView({ state, step }: StepInput): StepView {
  if (state.open === step) return "open";
  return hasValue({ state, step }) ? "done" : "locked";
}
