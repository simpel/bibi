import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  execute,
  getItem,
  type ItemCustomisationGroupInput,
  type ItemUpdateInputSchema,
  saveItemAsBundle,
  updateEntityType,
  updateItem,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import {
  createItemType,
  createLunch,
  createMealSetup,
  mainCourse,
  sortedGroups,
} from "./item-customisation-group-helpers";

const same = ({ a, b }: { a: ItemCustomisationGroupInput[]; b: ItemCustomisationGroupInput[] }) =>
  expect(sortedGroups({ groups: a })).toEqual(sortedGroups({ groups: b }));

describe("item customisation groups (ADR 0021, 0059)", () => {
  it("creates and edits groups of options apart from the parts", async () => {
    const context = testContext();
    const { meal, cod, veal, salad } = await createMealSetup({ context });
    const customisationGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({
        ...{ context, entityTypeId: meal.id, parts: [salad], customisationGroups },
      }),
    });
    same({ a: lunch.customisationGroups, b: customisationGroups });
    expect(lunch.parts.map((part) => part.itemId)).toEqual([salad]);
    const update = ({ input }: { input: Omit<z.input<typeof ItemUpdateInputSchema>, "id"> }) =>
      execute({ operation: updateItem, input: { id: lunch.id, ...input }, context });
    const wider = [mainCourse({ itemIds: [cod, veal, salad], maxPick: 2, priceEffect: "EXTRA" })];
    const widened = unwrap({ result: await update({ input: { customisationGroups: wider } }) });
    same({ a: widened.customisationGroups, b: wider });
    // Changing only the parts keeps the groups: options are not parts.
    const kept = unwrap({ result: await update({ input: { parts: [] } }) });
    same({ a: kept.customisationGroups, b: wider });
    const read = await execute({ operation: getItem, input: { id: lunch.id }, context });
    same({ a: unwrap({ result: read }).customisationGroups, b: wider });
  });

  it("validates the groups and their options", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const attempt = ({ groups }: { groups: ItemCustomisationGroupInput[] }) =>
      createLunch({ context, entityTypeId: meal.id, parts: [], customisationGroups: groups });
    const invalid: ItemCustomisationGroupInput[][] = [
      [mainCourse({ itemIds: [cod, veal], minPick: 2, maxPick: 1 })],
      [mainCourse({ itemIds: [cod, veal], maxPick: 3 })],
      [mainCourse({ itemIds: [cod, veal] }), { ...mainCourse({ itemIds: [veal] }), name: "Other" }],
      [mainCourse({ itemIds: [cod] }), mainCourse({ itemIds: [veal] })],
      [mainCourse({ itemIds: ["unknown-item"] })],
    ];
    for (const groups of invalid) {
      expect(errorCode({ result: await attempt({ groups }) })).toBe("VALIDATION");
    }
    const optional = mainCourse({ itemIds: [cod, veal], minPick: 0, maxPick: 2 });
    expect(errorCode({ result: await attempt({ groups: [optional] }) })).toBeNull();
  });

  it("refuses an item as its own option and another organization's item", async () => {
    const context = testContext();
    const { meal, cod } = await createMealSetup({ context });
    const foreign = await createMealSetup({ context: testContext() });
    const lunch = unwrap({
      result: await createLunch({ context, entityTypeId: meal.id, parts: [] }),
    });
    for (const itemIds of [[lunch.id], [cod, foreign.cod]]) {
      const groups = [mainCourse({ itemIds })];
      const input = { id: lunch.id, customisationGroups: groups };
      const result = await execute({ operation: updateItem, input, context });
      expect(errorCode({ result })).toBe("VALIDATION");
    }
  });

  it("only accepts customisation groups when the type has CUSTOMISATIONS", async () => {
    const context = testContext();
    const { cod } = await createMealSetup({ context });
    const pkg = await createItemType({ context, name: "Bundle", capabilities: ["BUNDLE"] });
    const customisationGroups = [mainCourse({ itemIds: [cod] })];
    const result = await createLunch({
      ...{ context, entityTypeId: pkg.id, parts: [], customisationGroups },
    });
    expect(result.ok ? null : result.error.issues[0]?.path).toBe("customisationGroups");
  });

  it("keeps CUSTOMISATIONS on while customisation groups exist", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const customisationGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({ context, entityTypeId: meal.id, parts: [], customisationGroups }),
    });
    const input = { id: meal.id, capabilities: ["BUNDLE" as const] };
    const off = () => execute({ operation: updateEntityType, input, context });
    expect(errorCode({ result: await off() })).toBe("CONFLICT");
    const cleared = await execute({
      operation: updateItem,
      input: { id: lunch.id, customisationGroups: [] },
      context,
    });
    unwrap({ result: cleared });
    expect(errorCode({ result: await off() })).toBeNull();
  });

  it("supports customisation groups on a customer bundle and validates the limits", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const customerId = (await createTestCustomer({ context, name: "Acme" })).id;
    const save = ({ maxPick }: { maxPick: number }) =>
      execute({
        operation: saveItemAsBundle,
        input: {
          entityTypeId: meal.id,
          customerId,
          name: "Acme lunch",
          parts: [{ itemId: cod }],
          customisationGroups: [mainCourse({ itemIds: [cod, veal], maxPick })],
        },
        context,
      });
    expect(errorCode({ result: await save({ maxPick: 3 }) })).toBe("VALIDATION");
    const saved = unwrap({ result: await save({ maxPick: 2 }) });
    expect(saved.customerId).toBe(customerId);
    expect(saved.customisationGroups).toHaveLength(1);
  });
});
