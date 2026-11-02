import type { DraftLine } from "./draft-line";

/** What step 4 adds beyond the ticket's own details, all optional (spec "More"). */
export type IntakeMore = {
  /** Null: the creating member (the page fills it in). */
  assigneeId: string | null;
  /** ISO instant; null: nothing expires. */
  holdsUntil: string | null;
};

/**
 * Step 4: the booking being built (ADR 0081). Lines are planned for `plannedStart`; when the
 * ticket's start moves away from it the review asks what happens to them.
 */
export type IntakeReview = {
  lines: DraftLine[];
  /** ISO instant the lines were planned for; null when none were planned yet. */
  plannedStart: string | null;
  /** The pick the lines were built from (`ONE_OFF` or a package id): Next again keeps them. */
  pickKey: string;
  /** The lines the choices step asks (ADR 0089): a package's lines with a required group. */
  choiceKeys: string[];
  /** The ticket's title; empty: one is generated after the ticket is created. */
  title: string;
  note: string;
  /** One-off: the ticket type; a package uses its own. */
  ticketTypeId: string | null;
  /** The ticket type's own field values, typed, by key. */
  ticketFields: Record<string, unknown>;
  saveAsPackage: boolean;
  packageName: string;
  more: IntakeMore;
  /**
   * Open questions answered without changing a line: `LEAD` (create without lines) and
   * `POOL:<line key>` (prebook a short pool), see `open-questions.ts`.
   */
  accepted: string[];
};

export type NewReviewInput = {
  lines: DraftLine[];
  plannedStart: string | null;
  pickKey: string;
  choiceKeys?: string[];
};

export function newReview({
  lines,
  plannedStart,
  pickKey,
  choiceKeys = [],
}: NewReviewInput): IntakeReview {
  return {
    ...{ lines, plannedStart, pickKey, choiceKeys },
    title: "",
    note: "",
    ticketTypeId: null,
    ticketFields: {},
    saveAsPackage: false,
    packageName: "",
    more: { assigneeId: null, holdsUntil: null },
    accepted: [],
  };
}
