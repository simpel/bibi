import type { FloorElement, FloorElementKind } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { PlacedElement } from "./footprint";
import type { FloorElementDto, FloorElementInput } from "./schema";
import { effectiveElement, isOpening } from "./seats";

type Db = { context: Pick<OperationContext, "db"> };

export const ELEMENT_INCLUDE = { kind: true } as const;
export type ElementRow = FloorElement & { kind: FloorElementKind };

/** One stored element with its kind's shape and its effective size and seats. */
export function toElementDto({ row }: { row: ElementRow }): FloorElementDto {
  const effective = effectiveElement({ element: row, kind: row.kind });
  const { id, kindId, xCm, yCm, rotationDeg, widthCm, depthCm, label } = row;
  const { seats, seatsTop, seatsRight, seatsBottom, seatsLeft, swingDeg } = row;
  // Only a door or window can be an exit.
  const emergencyExit = row.emergencyExit && isOpening(effective);
  return {
    ...{ id, kindId, xCm, yCm, rotationDeg, widthCm, depthCm, label },
    ...{ seats, seatsTop, seatsRight, seatsBottom, seatsLeft, swingDeg, emergencyExit },
    shape: effective.shape,
    fixed: effective.fixed,
    keepClearCm: effective.keepClearCm,
    effectiveWidthCm: effective.widthCm,
    effectiveDepthCm: effective.depthCm,
    effectiveAround: effective.around,
    effectiveSides: effective.sides,
    effectiveSwingDeg: effective.swingDeg,
    seatCount: effective.seatCount,
  };
}

/** An element DTO as the geometry functions take it. */
export const toPlaced = ({ element }: { element: FloorElementDto }): PlacedElement => ({
  id: element.id,
  xCm: element.xCm,
  yCm: element.yCm,
  rotationDeg: element.rotationDeg,
  shape: element.shape,
  widthCm: element.effectiveWidthCm,
  depthCm: element.effectiveDepthCm,
  around: element.effectiveAround,
  sides: element.effectiveSides,
  seatCount: element.seatCount,
  fixed: element.fixed,
  keepClearCm: element.keepClearCm,
  swingDeg: element.effectiveSwingDeg,
  emergencyExit: element.emergencyExit,
});

/** A stored element as save input: its position and own overrides (for copying a layout). */
export const toInput = ({ element }: { element: FloorElementDto }): FloorElementInput => {
  const { kindId, xCm, yCm, rotationDeg, widthCm, depthCm, label, swingDeg } = element;
  const { seats, seatsTop, seatsRight, seatsBottom, seatsLeft, emergencyExit } = element;
  return {
    ...{ kindId, xCm, yCm, rotationDeg, widthCm, depthCm, label, swingDeg, emergencyExit },
    ...{ seats, seatsTop, seatsRight, seatsBottom, seatsLeft },
  };
};

export type Parent = { floorPlanId: string } | { setupLayoutId: string };

/** The parent's elements in drawing order. */
export async function loadElements({ context, parent }: Db & { parent: Parent }) {
  const rows = await context.db.floorElement.findMany({
    where: parent,
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: ELEMENT_INCLUDE,
  });
  return rows.map((row) => toElementDto({ row }));
}

export type KindShape = { shape: FloorElementKind["shape"]; widthCm: number };

export type CheckKindsInput = Db & { elements: readonly FloorElementInput[]; fixed: boolean };

/** Every kind is active in the organization; a floor plan takes fixed kinds, a layout the rest. */
export async function checkKinds({
  context,
  elements,
  fixed,
}: CheckKindsInput): Promise<Result<ReadonlyMap<string, KindShape>>> {
  const ids = [...new Set(elements.map((element) => element.kindId))];
  const kinds = await context.db.floorElementKind.findMany({
    where: { id: { in: ids } },
    select: { id: true, fixed: true, shape: true, widthCm: true },
  });
  const known = new Map(kinds.map((kind) => [kind.id, kind.fixed]));
  const shapes = new Map(kinds.map(({ id, shape, widthCm }) => [id, { shape, widthCm }]));
  const issues = elements.flatMap((element, index) => {
    const kindFixed = known.get(element.kindId);
    if (kindFixed === undefined)
      return [{ path: `elements.${index}.kindId`, message: "Unknown kind" }];
    if (kindFixed !== fixed) {
      const message = fixed
        ? "Only fixed kinds belong in a floor plan"
        : "Fixed kinds belong in the floor plan";
      return [{ path: `elements.${index}.kindId`, message }];
    }
    return [];
  });
  return issues.length
    ? invalid({ message: issues[0]?.message ?? "Invalid kind", issues })
    : ok({ value: shapes });
}

export type ReplaceElementsInput = {
  context: OperationContext;
  parent: Parent;
  elements: readonly FloorElementInput[];
};

/** Replaces the parent's elements. Join-like rows without history; the parent carries the audit. */
export async function replaceElements({ context, parent, elements }: ReplaceElementsInput) {
  await context.db.floorElement.deleteMany({ where: parent });
  await context.db.floorElement.createMany({
    data: elements.map((element, position) => ({
      ...parent,
      organizationId: context.organizationId,
      position,
      kindId: element.kindId,
      xCm: element.xCm,
      yCm: element.yCm,
      rotationDeg: element.rotationDeg ?? 0,
      widthCm: element.widthCm ?? null,
      depthCm: element.depthCm ?? null,
      seats: element.seats ?? null,
      seatsTop: element.seatsTop ?? null,
      seatsRight: element.seatsRight ?? null,
      seatsBottom: element.seatsBottom ?? null,
      seatsLeft: element.seatsLeft ?? null,
      swingDeg: element.swingDeg ?? null,
      emergencyExit: element.emergencyExit ?? false,
      label: element.label || null,
    })),
  });
}
