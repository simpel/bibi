import { describe, expect, it } from "vitest";
import {
  activatePipelineSetup,
  archiveItemTypeGroup,
  createEntityType,
  createItem,
  createItemTypeGroup,
  type ExecuteContext,
  execute,
  listItems,
  listItemTypeGroups,
  reorderItemTypeGroups,
  updateEntityType,
  updateItemTypeGroup,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { estateDraft, roomType } from "./pipeline-setup-helpers";

type GroupInput = { context: ExecuteContext; name: string };

async function group({ context, name }: GroupInput) {
  const input = { name };
  return unwrap({ result: await execute({ operation: createItemTypeGroup, input, context }) });
}

async function itemType({ context, name, groupId }: GroupInput & { groupId?: string }) {
  const input = { base: "ITEM" as const, name, ...(groupId ? { groupId } : {}) };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

describe("item type groups (ADR 0101)", () => {
  it("creates groups last, refuses a duplicate name and reorders", async () => {
    const context = testContext();
    const spaces = await group({ context, name: "Spaces" });
    const food = await group({ context, name: "Food" });
    expect([spaces.position, food.position]).toEqual([0, 1]);
    const duplicate = await execute({
      operation: createItemTypeGroup,
      input: { name: "food" },
      context,
    });
    expect(errorCode({ result: duplicate })).toBe("CONFLICT");
    const rename = await execute({
      operation: updateItemTypeGroup,
      input: { id: food.id, name: "SPACES" },
      context,
    });
    expect(errorCode({ result: rename })).toBe("CONFLICT");
    const input = { ids: [food.id, spaces.id] };
    unwrap({ result: await execute({ operation: reorderItemTypeGroups, input, context }) });
    const page = unwrap({
      result: await execute({ operation: listItemTypeGroups, input: {}, context }),
    });
    expect(page.items.map((row) => row.name)).toEqual(["Food", "Spaces"]);
    const partial = await execute({
      operation: reorderItemTypeGroups,
      input: { ids: [food.id] },
      context,
    });
    expect(errorCode({ result: partial })).toBe("VALIDATION");
  });

  it("filters items by group and by no group", async () => {
    const context = testContext();
    const spaces = await group({ context, name: "Spaces" });
    const room = await itemType({ context, name: "Room", groupId: spaces.id });
    const misc = await itemType({ context, name: "Misc" });
    for (const [entityTypeId, name] of [
      [room.id, "Hall"],
      [misc.id, "Thing"],
    ] as const) {
      const input = { entityTypeId, name, fields: {} };
      unwrap({ result: await execute({ operation: createItem, input, context }) });
    }
    const names = async ({ groupId }: { groupId: string | null }) => {
      const input = { groupId };
      const page = unwrap({ result: await execute({ operation: listItems, input, context }) });
      return page.items.map((item) => item.name);
    };
    expect(await names({ groupId: spaces.id })).toEqual(["Hall"]);
    expect(await names({ groupId: null })).toEqual(["Thing"]);
  });

  it("refuses a group on a non-item type and ungroups types when archived", async () => {
    const context = testContext();
    const spaces = await group({ context, name: "Spaces" });
    const customerType = await execute({
      operation: createEntityType,
      input: { base: "CUSTOMER", name: "Company", groupId: spaces.id },
      context,
    });
    expect(errorCode({ result: customerType })).toBe("VALIDATION");
    const room = await itemType({ context, name: "Room" });
    const input = { id: room.id, groupId: spaces.id };
    const moved = unwrap({
      result: await execute({ operation: updateEntityType, input, context }),
    });
    expect(moved.groupId).toBe(spaces.id);
    const archive = { id: spaces.id };
    unwrap({ result: await execute({ operation: archiveItemTypeGroup, input: archive, context }) });
    const after = await context.db.entityType.findFirstOrThrow({ where: { id: room.id } });
    expect(after.groupId).toBeNull();
  });

  it("activate creates the draft's groups and keeps an existing type's group", async () => {
    const context = testContext();
    const room = await roomType({ context });
    const own = await group({ context, name: "Rooms" });
    unwrap({
      result: await execute({
        operation: updateEntityType,
        input: { id: room.id, groupId: own.id },
        context,
      }),
    });
    const draft = estateDraft({ roomTypeId: room.id });
    const input = {
      ...draft,
      itemTypes: draft.itemTypes.map((type) => ({
        ...type,
        group: type.name === "Room" ? "Spaces" : "food",
      })),
    };
    await group({ context, name: "Food" });
    unwrap({ result: await execute({ operation: activatePipelineSetup, input, context }) });
    const groups = await context.db.itemTypeGroup.findMany({ orderBy: { position: "asc" } });
    expect(groups.map((row) => row.name)).toEqual(["Rooms", "Food", "Spaces"]);
    const types = await context.db.entityType.findMany({ where: { base: "ITEM" } });
    const groupOf = ({ name }: { name: string }) =>
      groups.find((row) => row.id === types.find((type) => type.name === name)?.groupId)?.name;
    expect(groupOf({ name: "Room" })).toBe("Rooms");
    expect(groupOf({ name: "Dish" })).toBe("Food");
  });
});
