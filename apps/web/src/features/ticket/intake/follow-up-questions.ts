import type { PreviewEntry } from "@bibi/core";

/** One follow-up question a picked package needs, in the spec's order. */
export type FollowUpQuestion =
  /** The headcount is outside the guest range: `guests` is the nearest end of it. */
  | { kind: "GUESTS"; guests: number; raise: boolean }
  /** The last line ends after the requested end. */
  | { kind: "END"; endsAt: Date }
  /** A line meets a hard hold; `firstFreeStart` is null when no time on the day is free. */
  | { kind: "CLASH"; firstFreeStart: Date | null };

export type FollowUpQuestionsInput = { entry: PreviewEntry; headcount: number };

function guestsQuestion({ entry, headcount }: FollowUpQuestionsInput): FollowUpQuestion | null {
  const issue = entry.issues.find(({ kind }) => kind === "GUESTS_OUTSIDE_RANGE");
  if (!issue) return null;
  if (issue.maxGuests !== null && headcount > issue.maxGuests) {
    return { kind: "GUESTS", guests: issue.maxGuests, raise: false };
  }
  return issue.minGuests === null ? null : { kind: "GUESTS", guests: issue.minGuests, raise: true };
}

const hasHardClash = ({ entry }: { entry: PreviewEntry }) =>
  entry.lines.some((line) => line.issues.some(({ kind }) => kind === "HARD_CLASH"));

/**
 * What picking this package must ask first (spec "Picking a package"): guests outside the range,
 * a run past the requested end, then clashes. Empty: the package can be picked as it is.
 */
export function followUpQuestions({
  entry,
  headcount,
}: FollowUpQuestionsInput): FollowUpQuestion[] {
  const questions: FollowUpQuestion[] = [];
  const guests = guestsQuestion({ entry, headcount });
  if (guests) questions.push(guests);
  const end = entry.issues.find(({ kind }) => kind === "PAST_REQUESTED_END");
  const endsAt = end?.endsAt ?? entry.endsAt;
  if (end && endsAt) questions.push({ kind: "END", endsAt });
  if (entry.group === "CLASHES" || hasHardClash({ entry })) {
    questions.push({ kind: "CLASH", firstFreeStart: entry.firstFreeStart });
  }
  return questions;
}
