import type { DraftLine } from "./draft-line";
import type { MessageDraft } from "./message-draft";
import type { IntakeReview } from "./review-state";

/** The steps of the intake page in order; `review` is reached when every step has a value. */
export const INTAKE_STEPS = ["who", "when", "package"] as const;
export type InputStep = (typeof INTAKE_STEPS)[number];
/** `message` is step 0, reading a request (ADR 0084), shown only when asked for. */
export type IntakeStep = InputStep | "review" | "message";

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
  /** Step 4, once step 3 was completed; kept when an earlier step changes. */
  review: IntakeReview | null;
  /** Generated once per intake and kept in the draft: Create is idempotent (ADR 0081). */
  intakeKey: string;
  /** The inbox message it is made from (ADR 0085), attached on Create; kept in the draft. */
  inboundMessageId?: string | null | undefined;
  /** What the assistant read from a message (step 0), or null. */
  draft?: MessageDraft | null | undefined;
};

export type InitialIntakeInput = {
  intakeKey: string;
  inboundMessageId?: string | null;
  /** Start in step 0 (opened from a message while drafting is available). */
  fromMessage?: boolean;
};

export const initialIntake = ({
  intakeKey,
  inboundMessageId = null,
  fromMessage = false,
}: InitialIntakeInput): IntakeState => ({
  ...{ open: fromMessage ? "message" : "who", who: null, when: null, pick: null, review: null },
  ...{ intakeKey, inboundMessageId, draft: null },
});

/** A change to step 4; `lines` replaces the list, the rest patches the review. */
export type ReviewPatch = Partial<IntakeReview>;

export type IntakeAction =
  | { type: "setWho"; who: IntakeWho }
  | { type: "setWhen"; when: IntakeWhen }
  /** A package picked with its answers applied to `when`, or a one-off; step 3 stays open. */
  | { type: "pick"; pick: IntakePick; when?: IntakeWhen }
  | { type: "unpick" }
  /** Step 3 done: the lines step 4 starts with (or keeps), planned for `plannedStart`. */
  | { type: "completePackage"; lines: DraftLine[]; plannedStart: string | null }
  | { type: "patchReview"; patch: ReviewPatch }
  | { type: "change"; step: InputStep }
  | { type: "restore"; state: IntakeState }
  /** Step 0: open it, leave it to fill in by hand, or apply what was read. */
  | { type: "openMessage" }
  | { type: "skipMessage" }
  | { type: "applyDraft"; who: IntakeWho | null; when: IntakeWhen | null; draft: MessageDraft }
  /** After Create, or a discarded draft: a fresh intake with a new key. */
  | { type: "reset"; intakeKey: string };

type StepInput = { state: IntakeState; step: InputStep };

/** Whether lines exist: step 2 goes back to review and step 3 asks before switching. */
export const hasLines = ({ state }: { state: IntakeState }): boolean =>
  (state.review?.lines.length ?? 0) > 0;

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
