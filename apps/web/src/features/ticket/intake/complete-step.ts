import type { PreviewEntry } from "@bibi/core";
import type { DraftLine, NewKey } from "./draft-line";
import { linesFromEntry, nextLines, type SwitchChoice } from "./draft-lines";
import type { IntakePeriod } from "./intake-period";
import type { IntakePick } from "./intake-state";
import type { IntakeReview } from "./review-state";

/** What step 3's Next must ask first when lines exist (spec "Switching"). */
export type SwitchQuestion = "TO_PACKAGE" | "TO_ONE_OFF";

const pickKeyOf = ({ pick }: { pick: IntakePick }) =>
  pick.kind === "ONE_OFF" ? "ONE_OFF" : pick.templateId;

export type SwitchQuestionInput = { review: IntakeReview | null; pick: IntakePick };

/** Null when nothing is lost: no lines yet, or the same pick as the lines came from. */
export function switchQuestion({ review, pick }: SwitchQuestionInput): SwitchQuestion | null {
  if (!review || review.lines.length === 0) return null;
  if (review.pickKey === pickKeyOf({ pick })) return null;
  return pick.kind === "ONE_OFF" ? "TO_ONE_OFF" : "TO_PACKAGE";
}

export type CompletionInput = {
  review: IntakeReview | null;
  pick: IntakePick;
  period: IntakePeriod;
  /** The picked package's preview entry for the current period; null for a one-off. */
  entry: PreviewEntry | null;
  newKey: NewKey;
  /** The switching answer, when `switchQuestion` asked one. */
  choice?: SwitchChoice;
};

export type Completion = { lines: DraftLine[]; plannedStart: string | null };

/**
 * The lines step 4 gets when step 3 is done (ADR 0081): a package's planned lines (shortened to
 * the requested end when that was the answer), none for a one-off, merged with the lines that
 * exist as the switching answer says. The same pick again keeps the lines as they are.
 */
export function completion({
  review,
  pick,
  period,
  entry,
  newKey,
  choice,
}: CompletionInput): Completion {
  const start = period.startsAt.toISOString();
  if (review && review.pickKey === pickKeyOf({ pick })) {
    return { lines: review.lines, plannedStart: review.plannedStart ?? start };
  }
  const shortenTo =
    pick.kind === "PACKAGE" && pick.answers.end === "KEEP" ? period.endsAt : undefined;
  const incoming = entry ? linesFromEntry({ entry, newKey, shortenTo }) : [];
  const current = review?.lines ?? [];
  if (current.length === 0 || !choice) return { lines: incoming, plannedStart: start };
  const lines = nextLines({ current, incoming, choice });
  const plannedStart = choice === "KEEP" ? (review?.plannedStart ?? start) : start;
  return { lines, plannedStart };
}
