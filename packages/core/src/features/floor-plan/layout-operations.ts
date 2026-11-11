import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { checkKinds, loadElements, replaceElements, toInput } from "./element-rows";
import { checkHardLimits, checkNameFree, readLayout } from "./layout-read";
import {
  LayoutCreateInputSchema,
  LayoutIdInputSchema,
  LayoutSaveInputSchema,
  LayoutSchema,
} from "./layout-schema";
import { checkSetupsItem, checkVersion, raceLost } from "./plan-load";

/** The saved layout, or `VALIDATION` that rolls the save back when it breaks a hard limit. */
async function readChecked({ context, id }: { context: OperationContext; id: string }) {
  const after = await readLayout({ context, id });
  if (!after.ok) return after;
  const pieceIds = after.value.elements.map((element) => element.id);
  const limits = checkHardLimits({ layout: after.value, pieceIds });
  // Returning an error from the handler rolls the transaction back (`execute`).
  return limits.ok ? after : err({ error: limits.error });
}

export const getLayout = defineOperation({
  name: "layout.get",
  kind: "query",
  description:
    "One layout of a room (a named way of furnishing it, ADR 0103): what it suits, the pieces " +
    "with their effective size and chairs, the plan they stand in (walls, doors, windows, " +
    "emergency exits), its capacity (typed, else its seats), setup and teardown minutes, the " +
    "room's people limit and problems. EXIT_BLOCKED and OVER_LIMIT are hard limits.",
  input: LayoutIdInputSchema,
  output: LayoutSchema,
  permission: "item:read",
  handler: ({ input, context }) => readLayout({ context, id: input.id }),
});

export const createLayout = defineOperation({
  name: "layout.create",
  kind: "command",
  description:
    "Create a layout of a room, e.g. Banquet 80: a name, optionally what it suits, a typed " +
    "capacity and setup and teardown minutes, empty or as a copy of another layout of the same " +
    "room (copyFromId). Names are unique in the room; the capacity may not exceed the room's " +
    "people limit.",
  input: LayoutCreateInputSchema,
  output: LayoutSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { itemId, name, copyFromId, ...fields } = input;
    const checked = await checkSetupsItem({ context, itemId });
    if (!checked.ok) return checked;
    const free = await checkNameFree({ context, itemId, name });
    if (!free.ok) return free;
    const source = copyFromId
      ? await context.db.setupLayout.findFirst({ where: { id: copyFromId, itemId } })
      : null;
    if (copyFromId && !source) return notFound({ entity: "Layout to copy" });
    const pick = <K extends keyof typeof fields>({ key }: { key: K }) =>
      fields[key] !== undefined ? (fields[key] ?? null) : (source?.[key] ?? null);
    const layout = await context.db.setupLayout.create({
      data: {
        ...{ itemId, name, version: 1, organizationId: context.organizationId },
        description: pick({ key: "description" }),
        capacity: pick({ key: "capacity" }),
        setupMinutes: pick({ key: "setupMinutes" }),
        teardownMinutes: pick({ key: "teardownMinutes" }),
        note: source?.note ?? null,
      },
    });
    if (source) {
      const pieces = await loadElements({ context, parent: { setupLayoutId: source.id } });
      const elements = pieces.map((element) => toInput({ element }));
      await replaceElements({ context, parent: { setupLayoutId: layout.id }, elements });
    }
    const after = await readChecked({ context, id: layout.id });
    if (after.ok) context.recordChange({ entityId: layout.id, after: after.value });
    return after;
  },
});

export const saveLayout = defineOperation({
  name: "layout.save",
  kind: "command",
  description:
    "Save a layout as a whole: the pieces (not fixed kinds) with position, rotation and their " +
    "own size and chairs where they differ from the kind, and optionally its name, what it " +
    "suits, typed capacity (null = its seats), setup and teardown minutes and note. Refused " +
    "(VALIDATION) when it holds more people than the room allows or a piece stands in front of " +
    "an emergency exit. Pass the version you loaded; a newer saved version gives CONFLICT.",
  input: LayoutSaveInputSchema,
  output: LayoutSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { id, expectedVersion, elements, name, ...fields } = input;
    const before = await readLayout({ context, id });
    if (!before.ok) return before;
    const version = checkVersion({ expected: expectedVersion, current: before.value.version });
    if (!version.ok) return version;
    if (name !== undefined) {
      const free = await checkNameFree({
        context,
        itemId: before.value.itemId,
        name,
        exceptId: id,
      });
      if (!free.ok) return free;
    }
    const kinds = await checkKinds({ context, elements, fixed: false });
    if (!kinds.ok) return kinds;
    const changed = Object.fromEntries(
      Object.entries({ name, ...fields }).filter(([, value]) => value !== undefined),
    );
    // The version in the where makes a concurrent save of the same version lose (CONFLICT).
    const moved = await context.db.setupLayout.updateMany({
      where: { id, version: before.value.version },
      data: { ...changed, version: before.value.version + 1 },
    });
    if (moved.count === 0) return raceLost();
    await replaceElements({ context, parent: { setupLayoutId: id }, elements });
    const after = await readChecked({ context, id });
    if (after.ok) context.recordChange({ entityId: id, before: before.value, after: after.value });
    return after;
  },
});

export const archiveLayout = defineOperation({
  name: "layout.archive",
  kind: "command",
  description:
    "Archive a layout. Order lines that already book it keep it; new lines cannot pick it.",
  input: LayoutIdInputSchema,
  output: LayoutSchema,
  permission: "item:write",
  handler: async ({ input: { id }, context }) => {
    const before = await readLayout({ context, id });
    if (!before.ok) return before;
    await context.db.setupLayout.update({ where: { id }, data: { status: "ARCHIVED" } });
    context.recordChange({ entityId: id, before: before.value });
    return ok({ value: before.value });
  },
});
