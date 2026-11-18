import type { LineDto } from "@bibi/core";

type LineWarning = LineDto["warnings"][number];

/**
 * Most severe first: an open required choice must be made, option quantities that do not add up
 * are wrong, a missing optional unit is a gap, and hours are advisory (ADR 0064, confirmed on save).
 */
const SEVERITY: readonly LineWarning["kind"][] = [
  "UNCHOSEN_REQUIRED_GROUP",
  "OPTION_SPLIT_MISMATCH",
  "UNFILLED_OPTIONAL_DEMAND",
  "OUTSIDE_ITEM_HOURS",
  "OUTSIDE_VENUE_HOURS",
];

/** A line's warnings, most severe first: the first is the one the row shows. */
export function bySeverity({ warnings }: { warnings: readonly LineWarning[] }): LineWarning[] {
  const rank = ({ warning }: { warning: LineWarning }) => SEVERITY.indexOf(warning.kind);
  return warnings.toSorted((a, b) => rank({ warning: a }) - rank({ warning: b }));
}
