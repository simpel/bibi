import type { PlanIssue, PlanLineIssue, PreviewEntry, PreviewLine } from "@bibi/core";

/** Test data only: a preview line with the given issue kinds. */
function line({ kinds }: { kinds: PlanLineIssue["kind"][] }): PreviewLine {
  const issues = kinds.map((kind) => ({
    kind,
    message: kind,
    ...{
      orderReference: null,
      orderTitle: null,
      startsAt: null,
      endsAt: null,
      refusesCreate: null,
    },
    ...{ otherLineIndex: null, capacity: null, demandId: null, needed: null, free: null },
    ...{ hoursKind: null, hoursOwnerId: null },
  }));
  return {
    ...{ index: 0, entityTypeId: "type", name: "Room", itemId: null, layoutId: null },
    ...{ startsAt: null, endsAt: null, quantity: null, effectiveQuantity: 1 },
    ...{ quantitySource: null, effectiveUnitPriceMinor: null, unitPriceSource: null },
    ...{ effectiveDiscountPercent: 0, discountSource: null, stateId: null },
    issues,
    options: [],
    addOns: [],
  };
}

export type EntryFixtureInput = {
  templateId?: string;
  group?: PreviewEntry["group"];
  lineIssues?: PlanLineIssue["kind"][][];
  issues?: Partial<PlanIssue>[];
  endsAt?: Date | null;
  firstFreeStart?: Date | null;
};

/** Test data only: a preview entry (one per package) with just what a test sets. */
export function entryFixture({
  templateId,
  group,
  lineIssues,
  issues,
  endsAt,
  firstFreeStart,
}: EntryFixtureInput): PreviewEntry {
  return {
    templateId: templateId ?? "pkg",
    group: group ?? "AVAILABLE",
    endsAt: endsAt ?? null,
    firstFreeStart: firstFreeStart ?? null,
    issues: (issues ?? []).map((issue) => ({
      kind: "GUESTS_OUTSIDE_RANGE",
      message: "",
      minGuests: null,
      maxGuests: null,
      endsAt: null,
      ...issue,
    })),
    lines: (lineIssues ?? [[]]).map((kinds) => line({ kinds })),
  };
}
