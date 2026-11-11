import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { checkKinds, type KindShape, replaceElements, toPlaced } from "./element-rows";
import type { FloorPoint } from "./footprint";
import { layoutIssues } from "./layout-issues";
import { loadLayoutSummaries } from "./layout-read";
import {
  type FloorPlanDto,
  FloorPlanItemInputSchema,
  FloorPlanSaveInputSchema,
  FloorPlanSchema,
  type LayoutSummaryDto,
} from "./layout-schema";
import { snapToWall } from "./openings";
import { checkSetupsItem, checkVersion, loadPlanState, raceLost } from "./plan-load";
import type { FloorElementDto, FloorElementInput } from "./schema";
import { isOpening } from "./seats";

type Db = { context: Pick<OperationContext, "db"> };

/** The plan, the room's people limit and every layout with its pieces. */
async function readPlan({ context, itemId }: Db & { itemId: string }): Promise<FloorPlanDto> {
  const [plan, item, layouts] = await Promise.all([
    loadPlanState({ context, itemId }),
    context.db.item.findFirst({ where: { id: itemId }, select: { maxPeople: true } }),
    loadLayoutSummaries({ context, itemId }),
  ]);
  return { ...plan, itemId, maxPeople: item?.maxPeople ?? null, layouts };
}

/**
 * `CONFLICT` when an emergency exit of the new plan has a piece of an existing layout in its zone
 * (ADR 0103): the exit cannot be marked or moved there until those layouts are cleared.
 */
function checkExitsClear({
  fixed,
  layouts,
  outline,
}: {
  fixed: readonly FloorElementDto[];
  layouts: readonly LayoutSummaryDto[];
  outline: readonly FloorPoint[];
}): Result<true> {
  const placedFixed = fixed.map((element) => toPlaced({ element }));
  const blocked = layouts.filter((layout) =>
    layoutIssues({
      outline,
      fixed: placedFixed,
      elements: layout.elements.map((element) => toPlaced({ element })),
    }).some((issue) => issue.kind === "EXIT_BLOCKED"),
  );
  if (blocked.length === 0) return ok({ value: true });
  const names = blocked.map((layout) => layout.name).join(", ");
  const message = `Furniture in these layouts stands in front of an emergency exit: ${names}`;
  return conflict({
    message,
    issues: blocked.map((layout) => ({ path: `layouts.${layout.id}`, message })),
  });
}

/** Doors and windows moved onto the nearest wall of the outline (ADR 0102). */
function snapOpenings({
  elements,
  kinds,
  outline,
}: {
  elements: readonly FloorElementInput[];
  kinds: ReadonlyMap<string, KindShape>;
  outline: readonly FloorPoint[];
}): FloorElementInput[] {
  return elements.map((element) => {
    const kind = kinds.get(element.kindId);
    if (!kind || !isOpening(kind)) return element;
    const widthCm = element.widthCm ?? kind.widthCm;
    const { xCm, yCm } = element;
    return { ...element, ...snapToWall({ outline, xCm, yCm, widthCm }) };
  });
}

export const getFloorPlan = defineOperation({
  name: "floorPlan.get",
  kind: "query",
  description:
    "The floor plan of an item with setups: size in centimetres, wall outline, fixed elements " +
    "(doors, windows with emergency exits, pillars), the room's people limit and every layout " +
    "with its pieces and capacity. " +
    "Before anything is saved it is a 10 × 8 m rectangle with version 0.",
  input: FloorPlanItemInputSchema,
  output: FloorPlanSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const checked = await checkSetupsItem({ context, itemId: input.itemId });
    if (!checked.ok) return checked;
    return ok({ value: await readPlan({ context, itemId: input.itemId }) });
  },
});

export const saveFloorPlan = defineOperation({
  name: "floorPlan.save",
  kind: "command",
  description:
    "Save an item's floor plan as a whole: size, outline, minimum aisle and its fixed elements " +
    "(fixed kinds only). Doors and windows are moved onto the nearest wall and turned along it. " +
    "Marking or moving an emergency exit so that an existing layout blocks it is CONFLICT. " +
    "Pass the version you loaded; a newer saved version gives CONFLICT.",
  input: FloorPlanSaveInputSchema,
  output: FloorPlanSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { itemId, expectedVersion, elements, ...shape } = input;
    const checked = await checkSetupsItem({ context, itemId });
    if (!checked.ok) return checked;
    const before = await loadPlanState({ context, itemId });
    const version = checkVersion({ expected: expectedVersion, current: before.version });
    if (!version.ok) return version;
    const kinds = await checkKinds({ context, elements, fixed: true });
    if (!kinds.ok) return kinds;
    const data = { ...shape, version: before.version + 1 };
    // The version in the where makes a concurrent save of the same version lose (CONFLICT).
    const moved = before.id
      ? await context.db.floorPlan.updateMany({
          where: { id: before.id, version: before.version },
          data,
        })
      : null;
    if (moved && moved.count === 0) return raceLost();
    const plan = before.id
      ? { id: before.id }
      : await context.db.floorPlan.create({
          data: { ...data, itemId, organizationId: context.organizationId },
        });
    const placed = snapOpenings({ elements, kinds: kinds.value, outline: shape.outline });
    await replaceElements({ context, parent: { floorPlanId: plan.id }, elements: placed });
    const after = await readPlan({ context, itemId });
    const exits = checkExitsClear({
      fixed: after.elements,
      layouts: after.layouts,
      outline: after.outline,
    });
    if (!exits.ok) return exits;
    context.recordChange({ entityId: plan.id, before: before.id ? before : undefined, after });
    return ok({ value: after });
  },
});
