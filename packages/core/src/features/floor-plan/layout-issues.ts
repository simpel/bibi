import {
  exitZone,
  type FloorPoint,
  footprint,
  insideOutline,
  keepClearZone,
  type PlacedElement,
  polygonsOverlap,
} from "./footprint";
import { isOpening } from "./seats";

export const LAYOUT_ISSUE_KINDS = [
  "OUTSIDE_OUTLINE",
  "OVERLAP",
  "KEEP_CLEAR",
  "EXIT_BLOCKED",
  "OVER_LIMIT",
] as const;

/** Issues that are hard limits (ADR 0103): a save that has them is refused. */
export const BLOCKING_ISSUE_KINDS: readonly LayoutIssueKind[] = ["EXIT_BLOCKED", "OVER_LIMIT"];
export type LayoutIssueKind = (typeof LAYOUT_ISSUE_KINDS)[number];

/** A problem with a drawing (ADR 0099). Only `BLOCKING_ISSUE_KINDS` refuse a save (ADR 0103). */
export type LayoutIssue = { kind: LayoutIssueKind; elementIds: string[] };

export type LayoutIssuesInput = {
  outline: readonly FloorPoint[];
  /** The floor plan's fixed elements. */
  fixed: readonly PlacedElement[];
  /** The layout's own elements (or, for the floor plan itself, none). */
  elements: readonly PlacedElement[];
  /** The layout's effective capacity and the room's people limit, for `OVER_LIMIT`. */
  capacity?: number | null;
  maxPeople?: number | null;
};

/** Zones and wall openings take no floor; a door's swing counts through its keep-clear area. */
const solid = ({ element }: { element: PlacedElement }) =>
  element.shape !== "ZONE" && !isOpening(element);

/**
 * Warnings for a layout: a piece outside the walls, two pieces whose floor overlaps (chairs
 * included; zones never count) and a piece in a fixed element's keep-clear area.
 */
export function layoutIssues({
  outline,
  fixed,
  elements,
  capacity = null,
  maxPeople = null,
}: LayoutIssuesInput): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const feet = new Map([...fixed, ...elements].map((e) => [e.id, footprint({ element: e })]));
  const foot = ({ element }: { element: PlacedElement }) => feet.get(element.id) ?? [];
  for (const element of elements) {
    if (!foot({ element }).every((point) => insideOutline({ point, outline }))) {
      issues.push({ kind: "OUTSIDE_OUTLINE", elementIds: [element.id] });
    }
  }
  const pieces = elements.filter((element) => solid({ element }));
  const pairs = [
    ...pieces.flatMap((a, index) => pieces.slice(index + 1).map((b) => [a, b] as const)),
    ...pieces.flatMap((a) =>
      fixed.filter((element) => solid({ element })).map((b) => [a, b] as const),
    ),
  ];
  for (const [a, b] of pairs) {
    if (polygonsOverlap({ a: foot({ element: a }), b: foot({ element: b }) })) {
      issues.push({ kind: "OVERLAP", elementIds: [a.id, b.id] });
    }
  }
  for (const zone of fixed.map((element) => keepClearZone({ element }))) {
    if (!zone) continue;
    for (const element of pieces) {
      if (polygonsOverlap({ a: zone, b: foot({ element }) })) {
        issues.push({ kind: "KEEP_CLEAR", elementIds: [element.id] });
      }
    }
  }
  const blocked = exitBlockers({ fixed, elements, foot });
  if (blocked.length) issues.push({ kind: "EXIT_BLOCKED", elementIds: blocked });
  if (capacity !== null && maxPeople !== null && capacity > maxPeople) {
    issues.push({ kind: "OVER_LIMIT", elementIds: [] });
  }
  return issues;
}

type ExitBlockersInput = {
  fixed: readonly PlacedElement[];
  elements: readonly PlacedElement[];
  foot: (input: { element: PlacedElement }) => readonly FloorPoint[];
};

/** The pieces (zones included: nothing may stand in an exit) inside an emergency exit's zone. */
function exitBlockers({ fixed, elements, foot }: ExitBlockersInput): string[] {
  const zones = fixed.flatMap((element) => {
    const zone = exitZone({ element });
    return zone ? [zone] : [];
  });
  return elements
    .filter((element) => !isOpening(element))
    .filter((element) => zones.some((zone) => polygonsOverlap({ a: zone, b: foot({ element }) })))
    .map((element) => element.id);
}
