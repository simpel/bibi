import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { checkKinds, replaceElements } from "./element-rows";
import {
  type FloorPlanDto,
  FloorPlanItemInputSchema,
  FloorPlanSaveInputSchema,
  FloorPlanSchema,
} from "./layout-schema";
import { effectiveCapacity, layoutKey, loadLayoutSeats } from "./layout-seats";
import { checkSetupsItem, checkVersion, loadPlanState, raceLost } from "./plan-load";

type Db = { context: Pick<OperationContext, "db"> };

/** The plan with one summary per setup the item has: seats drawn and the capacity that counts. */
async function readPlan({ context, itemId }: Db & { itemId: string }): Promise<FloorPlanDto> {
  const [plan, itemSetups, seats] = await Promise.all([
    loadPlanState({ context, itemId }),
    context.db.itemSetup.findMany({
      where: { itemId },
      orderBy: [{ createdAt: "asc" }, { setupId: "asc" }],
      select: { setupId: true, capacity: true },
    }),
    loadLayoutSeats({ context, itemIds: [itemId] }),
  ]);
  const layouts = itemSetups.map(({ setupId, capacity }) => {
    const drawn = seats.get(layoutKey({ itemId, setupId }));
    const seatCount = drawn?.seatCount ?? null;
    return {
      setupId,
      layoutId: drawn?.layoutId ?? null,
      seatCount,
      capacity,
      ...effectiveCapacity({ capacity, seatCount }),
    };
  });
  return { ...plan, itemId, layouts };
}

export const getFloorPlan = defineOperation({
  name: "floorPlan.get",
  kind: "query",
  description:
    "The floor plan of an item with setups: size in centimetres, wall outline, fixed elements " +
    "(doors, pillars) and, per setup the item has, its drawn seats and effective capacity. " +
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
    "(fixed kinds only). Pass the version you loaded; a newer saved version gives CONFLICT.",
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
    await replaceElements({ context, parent: { floorPlanId: plan.id }, elements });
    const after = await readPlan({ context, itemId });
    context.recordChange({ entityId: plan.id, before: before.id ? before : undefined, after });
    return ok({ value: after });
  },
});
