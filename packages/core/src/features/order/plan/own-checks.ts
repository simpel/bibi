import { lineIssue, type PlanLineIssue } from "./issue-schema";
import { overlaps, type Period, type PlannedLine } from "./planned-line";

export type SelfOverlapsInput = {
  lines: readonly PlannedLine[];
  /** The blocked period of each line (null when it holds nothing), by index. */
  periods: readonly (Period | null)[];
  index: number;
};

/**
 * `SELF_OVERLAP`: another line of the same plan holds the same bookable item at an overlapping
 * time (buffers included), which the database would refuse once both are hard.
 */
export function selfOverlaps({ lines, periods, index }: SelfOverlapsInput): PlanLineIssue[] {
  const line = lines[index];
  const period = periods[index];
  if (!line?.itemId || !period) return [];
  return lines.flatMap((other, otherIndex) => {
    const otherPeriod = periods[otherIndex];
    if (otherIndex === index || other.itemId !== line.itemId || !otherPeriod) return [];
    if (!overlaps({ a: period, b: otherPeriod })) return [];
    return [
      lineIssue({
        kind: "SELF_OVERLAP",
        message: `"${line.name}" overlaps line ${otherIndex} ("${other.name}") on the same item`,
        otherLineIndex: otherIndex,
      }),
    ];
  });
}

export type SetupCapacityInput = {
  line: PlannedLine;
  quantity: number | null;
  capacity: number | undefined;
};

/** `SETUP_CAPACITY`: the effective quantity is above the chosen setup's capacity on the item. */
export function setupCapacity({ line, quantity, capacity }: SetupCapacityInput): PlanLineIssue[] {
  if (capacity === undefined || quantity === null || quantity <= capacity) return [];
  return [
    lineIssue({
      kind: "SETUP_CAPACITY",
      message: `"${line.name}": ${quantity} is above the setup's capacity of ${capacity}`,
      capacity,
    }),
  ];
}
