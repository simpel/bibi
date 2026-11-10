import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkKinds, loadElements, replaceElements, toInput } from "./element-rows";
import { checkNameFree, loadItemSetup, readLayout } from "./layout-read";
import {
  SetupLayoutCreateInputSchema,
  SetupLayoutIdInputSchema,
  SetupLayoutSaveInputSchema,
  SetupLayoutSchema,
} from "./layout-schema";
import { checkVersion, raceLost } from "./plan-load";

export const getSetupLayout = defineOperation({
  name: "setupLayout.get",
  kind: "query",
  description:
    "One layout of an item (a named way of furnishing it in one setup): the pieces with their " +
    "effective size and chairs, the plan they stand in (with its fixed elements, doors and " +
    "windows), this layout's seats, the setup's capacity in the item (a typed capacity, else the " +
    "largest layout's seats) and warnings (outside the walls, overlapping pieces, a blocked " +
    "keep-clear area such as a door's swing).",
  input: SetupLayoutIdInputSchema,
  output: SetupLayoutSchema,
  permission: "item:read",
  handler: ({ input, context }) => readLayout({ context, id: input.id }),
});

export const createSetupLayout = defineOperation({
  name: "setupLayout.create",
  kind: "command",
  description:
    "Create a named layout for one of an item's setups, e.g. Banquet 80 beside Banquet 60. It " +
    "starts empty, or as a copy of the pieces and note of another layout of the same item " +
    "(copyFromId). Names are unique within the item.",
  input: SetupLayoutCreateInputSchema,
  output: SetupLayoutSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { itemId, setupId, name, copyFromId } = input;
    const itemSetup = await loadItemSetup({ context, itemId, setupId });
    if (!itemSetup.ok) return itemSetup;
    const free = await checkNameFree({ context, itemId, name });
    if (!free.ok) return free;
    const source = copyFromId
      ? await context.db.setupLayout.findFirst({ where: { id: copyFromId, itemId } })
      : null;
    if (copyFromId && !source) return notFound({ entity: "Layout to copy" });
    const layout = await context.db.setupLayout.create({
      data: {
        ...{ itemId, setupId, name, note: source?.note ?? null, version: 1 },
        organizationId: context.organizationId,
      },
    });
    if (source) {
      const pieces = await loadElements({ context, parent: { setupLayoutId: source.id } });
      const elements = pieces.map((element) => toInput({ element }));
      await replaceElements({ context, parent: { setupLayoutId: layout.id }, elements });
    }
    const after = await readLayout({ context, id: layout.id });
    if (after.ok) context.recordChange({ entityId: layout.id, after: after.value });
    return after;
  },
});

export const saveSetupLayout = defineOperation({
  name: "setupLayout.save",
  kind: "command",
  description:
    "Save a layout as a whole: the pieces (not fixed kinds) with position, rotation and their " +
    "own size and chairs per side where they differ from the kind, and optionally a new name, " +
    "the note and the setup's typed capacity in the item (null = the largest layout's seats). " +
    "Pass the version you loaded; a newer saved version gives CONFLICT. Warnings never block.",
  input: SetupLayoutSaveInputSchema,
  output: SetupLayoutSchema,
  permission: "item:write",
  handler: async ({ input, context }) => {
    const { id, expectedVersion, name, note, capacity, elements } = input;
    const before = await readLayout({ context, id });
    if (!before.ok) return before;
    const { itemId, setupId } = before.value;
    const version = checkVersion({ expected: expectedVersion, current: before.value.version });
    if (!version.ok) return version;
    if (name !== undefined) {
      const free = await checkNameFree({ context, itemId, name, exceptId: id });
      if (!free.ok) return free;
    }
    const kinds = await checkKinds({ context, elements, fixed: false });
    if (!kinds.ok) return kinds;
    const data = {
      version: before.value.version + 1,
      ...(name === undefined ? {} : { name }),
      ...(note === undefined ? {} : { note }),
    };
    // The version in the where makes a concurrent save of the same version lose (CONFLICT).
    const moved = await context.db.setupLayout.updateMany({
      where: { id, version: before.value.version },
      data,
    });
    if (moved.count === 0) return raceLost();
    await replaceElements({ context, parent: { setupLayoutId: id }, elements });
    if (capacity !== undefined) {
      await context.db.itemSetup.updateMany({ where: { itemId, setupId }, data: { capacity } });
    }
    const after = await readLayout({ context, id });
    if (after.ok) context.recordChange({ entityId: id, before: before.value, after: after.value });
    return after;
  },
});

export const archiveSetupLayout = defineOperation({
  name: "setupLayout.archive",
  kind: "command",
  description:
    "Archive a layout. The setup's capacity then comes from the item's remaining layouts.",
  input: SetupLayoutIdInputSchema,
  output: SetupLayoutSchema,
  permission: "item:write",
  handler: async ({ input: { id }, context }) => {
    const before = await readLayout({ context, id });
    if (!before.ok) return before;
    await context.db.setupLayout.update({ where: { id }, data: { status: "ARCHIVED" } });
    context.recordChange({ entityId: id, before: before.value });
    return before;
  },
});
