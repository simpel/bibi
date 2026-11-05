import type { PlanGroup, PlanIssue, PlanLineIssue } from "./issue-schema";

export type GuestRange = { minGuests: number | null; maxGuests: number | null };

export type PlanIssuesInput = {
  headcount: number;
  /** The package's guest range; null for a draft. */
  range: GuestRange | null;
  /** When the plan's last timed line ends; null when no line is timed. */
  endsAt: Date | null;
  requestedEnd: Date;
};

const NO_FIELDS = { minGuests: null, maxGuests: null, endsAt: null } as const;

/** `GUESTS_OUTSIDE_RANGE` and `PAST_REQUESTED_END` (ADR 0081 decision 5). */
export function planIssues({ headcount, range, endsAt, requestedEnd }: PlanIssuesInput) {
  const issues: PlanIssue[] = [];
  const below = range?.minGuests != null && headcount < range.minGuests;
  const above = range?.maxGuests != null && headcount > range.maxGuests;
  if (range && (below || above)) {
    const bounds = `${range.minGuests ?? "any"}–${range.maxGuests ?? "any"}`;
    issues.push({
      ...NO_FIELDS,
      kind: "GUESTS_OUTSIDE_RANGE",
      message: `${headcount} guests is outside the package's range of ${bounds}`,
      ...{ minGuests: range.minGuests, maxGuests: range.maxGuests },
    });
  }
  if (endsAt && endsAt > requestedEnd) {
    issues.push({
      ...NO_FIELDS,
      kind: "PAST_REQUESTED_END",
      message: `The lines run to ${endsAt.toISOString()}, past the requested end`,
      endsAt,
    });
  }
  return issues;
}

export type PlanGroupInput = { issues: readonly PlanIssue[]; lineIssues: readonly PlanLineIssue[] };

/**
 * Step 3's group (ADR 0081 decision 5): outside the guest range or past the requested end wins
 * over everything; else any hard clash; else available (warnings allowed).
 */
export function planGroup({ issues, lineIssues }: PlanGroupInput): PlanGroup {
  if (issues.length > 0) return "OUTSIDE_RANGE";
  if (lineIssues.some((issue) => issue.kind === "HARD_CLASH")) return "CLASHES";
  return "AVAILABLE";
}

/** When the plan's last timed line ends, or null. */
export function lastEnd({ lines }: { lines: readonly { endsAt?: Date | null }[] }) {
  const ends = lines.flatMap((line) => (line.endsAt ? [line.endsAt.getTime()] : []));
  return ends.length ? new Date(Math.max(...ends)) : null;
}
