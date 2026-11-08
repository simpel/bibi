import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { checkKinds, loadElements, replaceElements, toPlaced } from "./element-rows";
import { layoutIssues } from "./layout-issues";
import {
  type SetupLayoutDto,
  SetupLayoutKeyInputSchema,
  SetupLayoutSaveInputSchema,
  SetupLayoutSchema,
} from "./layout-schema";
import { effectiveCapacity } from "./layout-seats";
import { checkSetupsItem, checkVersion, loadPlanState, raceLost } from "./plan-load";

type Db = { context: Pick<OperationContext, "db"> };
type Key = { itemId: string; setupId: string };

/** The item's setup row; a setup the item lacks reads as not found. */
async function loadItemSetup({ context, itemId, setupId }: Db & Key) {
  const checked = await checkSetupsItem({ context, itemId });
  if (!checked.ok) return checked;
  const row = await context.db.itemSetup.findFirst({
    where: { itemId, setupId },
    select: { id: true, capacity: true },
  });
  return row ? ok({ value: row }) : notFound({ entity: "Setup of the item" });
}

/** The layout with the plan it is drawn on, its seats, effective capacity and warnings. */
async function readLayout({ context, itemId, setupId }: Db & Key): Promise<Result<SetupLayoutDto>> {
  const itemSetup = await loadItemSetup({ context, itemId, setupId });
  if (!itemSetup.ok) return itemSetup;
  const [plan, layout] = await Promise.all([
    loadPlanState({ context, itemId }),
    context.db.setupLayout.findFirst({ where: { itemId, setupId } }),
  ]);
  const elements = layout
    ? await loadElements({ context, parent: { setupLayoutId: layout.id } })
    : [];
  const seatCount = layout ? elements.reduce((sum, element) => sum + element.seatCount, 0) : null;
  const { capacity } = itemSetup.value;
  const issues = layoutIssues({
    outline: plan.outline,
    fixed: plan.elements.map((element) => toPlaced({ element })),
    elements: elements.map((element) => toPlaced({ element })),
  });
  const { widthCm, depthCm, outline, minAisleCm } = plan;
  return ok({
    value: {
      ...{ itemId, setupId, layoutId: layout?.id ?? null, version: layout?.version ?? 0 },
      ...{ note: layout?.note ?? null, elements, seatCount, capacity, issues },
      ...effectiveCapacity({ capacity, seatCount }),
      plan: { widthCm, depthCm, outline, minAisleCm, elements: plan.elements },
    },
  });
}

export const getSetupLayout = defineOperation({
  name: "setupLayout.get",
  kind: "query",
  description:
    "One setup drawn in an item's floor plan: the pieces with their effective size and chairs, " +
    "the plan they stand in (with its fixed elements), the seat count, the effective capacity " +
    "(a typed capacity, else the seats) and warnings (outside the walls, overlapping pieces, a " +
    "blocked keep-clear area). Version 0 means nothing is drawn yet.",
  input: SetupLayoutKeyInputSchema,
  output: SetupLayoutSchema,
  permission: "item:read",
  handler: ({ input, context }) => readLayout({ context, ...input }),
});

export const saveSetupLayout = defineOperation({
  name: "setupLayout.save",
  kind: "command",
  description:
    "Save one setup's layout in an item as a whole: the pieces (not fixed kinds) with position, " +
    "rotation and their own size and chairs per side where they differ from the kind, an " +
    "optional note and, when given, the typed capacity (null = use the seats). Pass the " +
    "version you loaded; a newer saved version gives CONFLICT. Warnings never block the save.",
  input: SetupLayoutSaveInputSchema,
  output: SetupLayoutSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { itemId, setupId, expectedVersion, note, capacity, elements } = input;
    const before = await readLayout({ context, itemId, setupId });
    if (!before.ok) return before;
    const version = checkVersion({ expected: expectedVersion, current: before.value.version });
    if (!version.ok) return version;
    const kinds = await checkKinds({ context, elements, fixed: false });
    if (!kinds.ok) return kinds;
    const data = { version: before.value.version + 1, ...(note === undefined ? {} : { note }) };
    // The version in the where makes a concurrent save of the same version lose (CONFLICT).
    const { layoutId } = before.value;
    const moved = layoutId
      ? await context.db.setupLayout.updateMany({
          where: { id: layoutId, version: before.value.version },
          data,
        })
      : null;
    if (moved && moved.count === 0) return raceLost();
    const layout = layoutId
      ? { id: layoutId }
      : await context.db.setupLayout.create({
          data: { ...data, itemId, setupId, organizationId: context.organizationId },
        });
    await replaceElements({ context, parent: { setupLayoutId: layout.id }, elements });
    if (capacity !== undefined) {
      await context.db.itemSetup.updateMany({ where: { itemId, setupId }, data: { capacity } });
    }
    const after = await readLayout({ context, itemId, setupId });
    if (!after.ok) return after;
    context.recordChange({
      entityId: layout.id,
      before: before.value.layoutId ? before.value : undefined,
      after: after.value,
    });
    return after;
  },
});
