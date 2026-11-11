import type { PlanLineIssue, PreviewEntry, PreviewLine } from "@bibi/core";
import type { DraftLine } from "./draft-line";

/** Test data only: 20 November 2026 at `hour`:00 UTC. */
export const at = ({ hour }: { hour: number }) => new Date(Date.UTC(2026, 10, 20, hour));

export type DraftFixtureInput = Partial<DraftLine> & { from?: number; to?: number };

/** Test data only: a draft line on item `i1`, timed `[from, to)` when given. */
export function draftFixture({ from, to, ...rest }: DraftFixtureInput = {}): DraftLine {
  const timed = from !== undefined && to !== undefined;
  return {
    ...{ key: "l1", entityTypeId: "lt", name: "Room", itemId: "i1", layoutId: null },
    startsAt: timed ? at({ hour: from }).toISOString() : null,
    endsAt: timed ? at({ hour: to }).toISOString() : null,
    ...{ quantity: null, unitPriceMinor: null, discountPercent: null, note: null },
    ...{ options: [], needs: [], addOns: [], fields: {} },
    ...rest,
  };
}

/** Test data only: an issue of `kind` with the given fields, the rest null. */
export function issueFixture({ ...input }: Partial<PlanLineIssue> & Pick<PlanLineIssue, "kind">) {
  return {
    message: input.kind,
    ...{
      orderReference: null,
      orderTitle: null,
      startsAt: null,
      endsAt: null,
      refusesCreate: null,
    },
    ...{ otherLineIndex: null, capacity: null, demandId: null, needed: null, free: null },
    ...{ hoursKind: null, hoursOwnerId: null },
    ...input,
  } satisfies PlanLineIssue;
}

export type PreviewLineFixtureInput = Partial<PreviewLine> & { from?: number; to?: number };

/** Test data only: a planned line on `i1`, timed `[from, to)` when given. */
export function previewLineFixture({ from, to, ...rest }: PreviewLineFixtureInput): PreviewLine {
  const timed = from !== undefined && to !== undefined;
  return {
    ...{ index: 0, entityTypeId: "lt", name: "Room", itemId: "i1", layoutId: null },
    ...{ startsAt: timed ? at({ hour: from }) : null, endsAt: timed ? at({ hour: to }) : null },
    ...{ quantity: null, effectiveQuantity: 10, quantitySource: null },
    ...{ effectiveUnitPriceMinor: null, unitPriceSource: null },
    ...{ effectiveDiscountPercent: 0, discountSource: null, stateId: null, issues: [] },
    options: [],
    addOns: [],
    ...rest,
  };
}

/** Test data only: one preview entry with these lines. */
export const entryWith = ({ lines }: { lines: PreviewLine[] }): PreviewEntry => ({
  ...{ templateId: null, group: "AVAILABLE", endsAt: null, issues: [], firstFreeStart: null },
  lines,
});
