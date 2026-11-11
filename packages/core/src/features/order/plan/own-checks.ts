import { overPeopleLimit, peopleLimitMessage } from "../../line/people-limit";
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

export type LayoutCapacityInput = {
  line: PlannedLine;
  quantity: number | null;
  capacity: number | undefined;
};

/** `LAYOUT_CAPACITY`: the effective quantity is above the chosen layout's capacity (ADR 0103). */
export function layoutCapacity({ line, quantity, capacity }: LayoutCapacityInput): PlanLineIssue[] {
  if (capacity === undefined || quantity === null || quantity <= capacity) return [];
  return [
    lineIssue({
      kind: "LAYOUT_CAPACITY",
      message: `"${line.name}": ${quantity} is above the layout's capacity of ${capacity}`,
      capacity,
    }),
  ];
}

export type MaxPeopleInput = {
  line: PlannedLine;
  quantity: number | null;
  item: { name: string; maxPeople: number | null } | undefined;
};

/** `MAX_PEOPLE`: more people than the item's limit, which saving the line refuses (ADR 0103). */
export function maxPeople({ line, quantity, item }: MaxPeopleInput): PlanLineIssue[] {
  const limit = item?.maxPeople ?? null;
  if (!item || quantity === null || limit === null) return [];
  if (!overPeopleLimit({ quantity, maxPeople: limit })) return [];
  const message = peopleLimitMessage({
    ...{ lineName: line.name, itemName: item.name, quantity, maxPeople: limit },
  });
  return [lineIssue({ kind: "MAX_PEOPLE", message, capacity: limit })];
}
