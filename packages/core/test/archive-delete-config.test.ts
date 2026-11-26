import { describe, expect, it } from "vitest";
import {
  archiveEntityType,
  archiveFieldDefinition,
  archiveItem,
  archiveItemTypeGroup,
  archiveOrderStatus,
  archivePriceList,
  archiveSkill,
  archiveVenue,
  archiveVocabulary,
  createEntityType,
  createFieldDefinition,
  createItemTypeGroup,
  createOrderStatus,
  createPriceList,
  createSkill,
  createVenue,
  createVocabulary,
  deleteEntityType,
  deleteItem,
  deleteItemTypeGroup,
  deleteOrderStatus,
  deletePriceList,
  deleteSkill,
  deleteVenue,
  deleteVocabulary,
  type ExecuteContext,
  execute,
  restoreItemTypeGroup,
  restoreSkill,
  restoreVocabulary,
} from "../src/index";
import { rowOf, runOk, runOn } from "./archive-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

const create = async ({
  context,
  operation,
  input,
}: {
  context: ExecuteContext;
  operation: Parameters<typeof execute>[0]["operation"];
  input: unknown;
}) => unwrap({ result: await execute({ operation, input, context }) }) as { id: string };

describe("deleting archived configuration (ADR 0118)", () => {
  it("deletes a list unless a field uses it, and restores it with its values", async () => {
    const context = testContext();
    const list = await create({
      ...{ context, operation: createVocabulary },
      input: { name: "Allergener", values: ["Gluten", "Laktos"] },
    });
    const type = await create({
      ...{ context, operation: createEntityType },
      input: { base: "CUSTOMER", name: "Kund" },
    });
    const field = { entityTypeId: type.id, name: "Allergi", kind: "CHOICE", vocabularyId: list.id };
    const created = await create({ context, operation: createFieldDefinition, input: field });
    await runOk({ operation: archiveFieldDefinition, id: created.id, context });
    await runOk({ operation: archiveVocabulary, id: list.id, context });
    const blocked = await runOn({ operation: deleteVocabulary, id: list.id, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    const restored = await runOk({ operation: restoreVocabulary, id: list.id, context });
    expect(restored).toMatchObject({
      id: list.id,
      values: [{ name: "Gluten" }, { name: "Laktos" }],
    });
    await runOk({ operation: archiveVocabulary, id: list.id, context });
    await runOk({ operation: archiveEntityType, id: type.id, context });
    await runOk({ operation: deleteEntityType, id: type.id, context });
    await runOk({ operation: deleteVocabulary, id: list.id, context });
    expect(await rowOf({ table: "Vocabulary", id: list.id })).toBeNull();
    expect(
      await context.db.vocabularyValue.count({
        where: { vocabularyId: list.id, status: { in: ["ACTIVE", "ARCHIVED"] } },
      }),
    ).toBe(0);
  });

  it("refuses a type and a venue while an item is left, then deletes them in order", async () => {
    const context = testContext();
    const venue = await create({ context, operation: createVenue, input: { name: "Hallen" } });
    const type = await createRoomType({ context });
    const item = await createTestItem({
      ...{ context, entityTypeId: type.id, name: "Atrium", venueId: venue.id },
    });
    await runOk({ operation: archiveItem, id: item.id, context });
    await runOk({ operation: archiveVenue, id: venue.id, context });
    await runOk({ operation: archiveEntityType, id: type.id, context });
    for (const operation of [deleteVenue, deleteEntityType]) {
      const result = await runOn({
        operation,
        id: operation === deleteVenue ? venue.id : type.id,
        context,
      });
      expect(errorCode({ result })).toBe("CONFLICT");
    }
    await runOk({ operation: deleteItem, id: item.id, context });
    await runOk({ operation: deleteVenue, id: venue.id, context });
    await runOk({ operation: deleteEntityType, id: type.id, context });
    expect(await rowOf({ table: "Venue", id: venue.id })).toBeNull();
    expect(await rowOf({ table: "Item", id: item.id })).toBeNull();
  });

  it("deletes an unused status, price list and item type group", async () => {
    const context = testContext();
    const status = await create({
      ...{ context, operation: createOrderStatus },
      input: { name: "Parkerad", color: "#888888" },
    });
    const list = await create({ context, operation: createPriceList, input: { name: "Avtal" } });
    const group = await create({ context, operation: createItemTypeGroup, input: { name: "Mat" } });
    await runOk({ operation: archiveOrderStatus, id: status.id, context });
    await runOk({ operation: archivePriceList, id: list.id, context });
    await runOk({ operation: archiveItemTypeGroup, id: group.id, context });
    await runOk({ operation: restoreItemTypeGroup, id: group.id, context });
    await runOk({ operation: archiveItemTypeGroup, id: group.id, context });
    await runOk({ operation: deleteOrderStatus, id: status.id, context });
    await runOk({ operation: deletePriceList, id: list.id, context });
    await runOk({ operation: deleteItemTypeGroup, id: group.id, context });
    expect(
      await context.db.orderStatus.count({ where: { id: status.id, status: "ARCHIVED" } }),
    ).toBe(0);
  });

  it("deletes a personal skill for its owner only and restores it as a draft", async () => {
    const context = testContext();
    const input = { name: "Menu helper", description: "Suggests menus", instructions: "Be brief" };
    const skill = await create({ context, operation: createSkill, input });
    await runOk({ operation: archiveSkill, id: skill.id, context });
    const restored = await runOk({ operation: restoreSkill, id: skill.id, context });
    expect(restored).toMatchObject({ id: skill.id, status: "DRAFT" });
    await runOk({ operation: archiveSkill, id: skill.id, context });
    const colleague = { ...testContext(), organizationId: context.organizationId };
    const other = { ...colleague, db: context.db };
    const result = await runOn({ operation: deleteSkill, id: skill.id, context: other });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    await runOk({ operation: deleteSkill, id: skill.id, context });
    expect(await context.db.skill.count({ where: { id: skill.id, status: "ARCHIVED" } })).toBe(0);
  });
});
