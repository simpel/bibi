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

/** The stored columns of one input piece at `position`. */
const elementData = ({ element, position }: { element: FloorElementInput; position: number }) => ({
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
});

/**
 * Saves the parent's elements as a set (ADR 0119): a piece that names one of the parent's saved
 * ids keeps it (so a table keeps its bookings), the rest are created, and saved pieces left out
 * are deleted. An id of another parent, or one named twice, counts as a new piece. Join-like rows
 * without history; the parent carries the audit.
 */
export async function replaceElements({ context, parent, elements }: ReplaceElementsInput) {
  const saved = await context.db.floorElement.findMany({ where: parent, select: { id: true } });
  const free = new Set(saved.map((row) => row.id));
  const kept: { id: string; position: number; element: FloorElementInput }[] = [];
  const created: { position: number; element: FloorElementInput }[] = [];
  elements.forEach((element, position) => {
    if (element.id && free.delete(element.id)) kept.push({ id: element.id, position, element });
    else created.push({ position, element });
  });
  if (free.size > 0) {
    await context.db.floorElement.deleteMany({ where: { ...parent, id: { in: [...free] } } });
  }
  for (const { id, position, element } of kept) {
    await context.db.floorElement.updateMany({
      where: { ...parent, id },
      data: elementData({ element, position }),
    });
  }
  if (created.length > 0) {
    await context.db.floorElement.createMany({
      data: created.map(({ element, position }) => ({
        ...parent,
        organizationId: context.organizationId,
        ...elementData({ element, position }),
      })),
    });
  }
}
