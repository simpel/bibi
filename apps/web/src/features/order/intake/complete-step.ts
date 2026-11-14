import type { PreviewEntry } from "@bibi/core";
import type { DraftLine, NewKey } from "./draft-line";
import { linesFromEntry } from "./draft-lines";
import type { IntakePeriod } from "./intake-period";
import type { IntakePick } from "./intake-state";
import type { IntakeReview } from "./review-state";

const pickKeyOf = ({ pick }: { pick: IntakePick }) =>
  pick.kind === "ONE_OFF" ? "ONE_OFF" : pick.templateId;

export type ReplacesLinesInput = { review: IntakeReview | null; pick: IntakePick };

/**
 * How many lines the pick replaces (spec "Replacing lines"): 0 when nothing is lost, no lines
 * yet or the same pick as the lines came from. Lines are never merged.
 */
export function replacesLines({ review, pick }: ReplacesLinesInput): number {
  if (!review || review.pickKey === pickKeyOf({ pick })) return 0;
  return review.lines.length;
}

export type CompletionInput = {
  review: IntakeReview | null;
  pick: IntakePick;
  period: IntakePeriod;
  /** The picked package's preview entry for the current period; null for a custom booking. */
  entry: PreviewEntry | null;
  newKey: NewKey;
  /** The lines a new custom booking starts with (the calendar slot's resource); none if omitted. */
  customLines?: DraftLine[];
};

export type Completion = { lines: DraftLine[]; plannedStart: string | null };

/**
 * The lines the next step gets when step 3 is done (ADR 0081): a package's planned lines
 * (shortened to the requested end when that was the answer), or `customLines` for a new custom
 * booking.
 * The same pick again keeps the lines as they are.
 */
export function completion({
  review,
  pick,
  period,
  entry,
  newKey,
  customLines = [],
}: CompletionInput): Completion {
  const start = period.startsAt.toISOString();
  if (review && review.pickKey === pickKeyOf({ pick })) {
    return { lines: review.lines, plannedStart: review.plannedStart ?? start };
  }
  const shortenTo =
    pick.kind === "PACKAGE" && pick.answers.end === "KEEP" ? period.endsAt : undefined;
  const lines = entry ? linesFromEntry({ entry, newKey, shortenTo }) : customLines;
  return { lines, plannedStart: start };
}
