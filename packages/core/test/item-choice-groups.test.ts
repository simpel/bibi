import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  execute,
  getItem,
  type ItemChoiceGroupInput,
  type ItemUpdateInputSchema,
  saveItemAsPackage,
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
} from "./item-choice-group-helpers";

const same = ({ a, b }: { a: ItemChoiceGroupInput[]; b: ItemChoiceGroupInput[] }) =>
  expect(sortedGroups({ groups: a })).toEqual(sortedGroups({ groups: b }));

describe("item choice groups (ADR 0021)", () => {
  it("creates and edits a package with selectable options", async () => {
    const context = testContext();
    const { meal, cod, veal, salad } = await createMealSetup({ context });
    const parts = [salad, cod, veal];
    const choiceGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({ context, entityTypeId: meal.id, parts, choiceGroups }),
    });
    same({ a: lunch.choiceGroups, b: choiceGroups });
    const update = ({ input }: { input: Omit<z.input<typeof ItemUpdateInputSchema>, "id"> }) =>
      execute({ operation: updateItem, input: { id: lunch.id, ...input }, context });
    const wider = [mainCourse({ itemIds: parts, maxPick: 2 })];
    same({
      a: unwrap({ result: await update({ input: { choiceGroups: wider } }) }).choiceGroups,
      b: wider,
    });
    // Changing only the parts keeps the groups, as long as the options are still parts.
    const components = parts.map((itemId) => ({ itemId, quantity: 2 }));
    const kept = unwrap({ result: await update({ input: { components } }) });
    same({ a: kept.choiceGroups, b: wider });
    const dropped = await update({ input: { components: [{ itemId: cod }] } });
    expect(dropped.ok ? null : dropped.error.issues[0]?.path).toBe("choiceGroups");
    const read = await execute({ operation: getItem, input: { id: lunch.id }, context });
    same({ a: unwrap({ result: read }).choiceGroups, b: wider });
  });

  it("validates 0 <= minPick <= maxPick <= number of options", async () => {
    const context = testContext();
    const { meal, cod, veal, salad } = await createMealSetup({ context });
    const attempt = ({
      groups,
      parts = [cod, veal, salad],
    }: {
      groups: ItemChoiceGroupInput[];
      parts?: string[];
    }) => createLunch({ context, entityTypeId: meal.id, parts, choiceGroups: groups });
    const invalid: ItemChoiceGroupInput[][] = [
      [mainCourse({ itemIds: [cod, veal], minPick: 2, maxPick: 1 })],
      [mainCourse({ itemIds: [cod, veal], maxPick: 3 })],
      [mainCourse({ itemIds: [cod, veal] }), { ...mainCourse({ itemIds: [veal] }), name: "Other" }],
      [mainCourse({ itemIds: [cod] }), mainCourse({ itemIds: [veal] })],
    ];
    for (const groups of invalid) {
      expect(errorCode({ result: await attempt({ groups }) })).toBe("VALIDATION");
    }
    const notAPart = await attempt({ groups: [mainCourse({ itemIds: [veal] })], parts: [cod] });
    expect(errorCode({ result: notAPart })).toBe("VALIDATION");
    const optional = mainCourse({ itemIds: [cod, veal], minPick: 0, maxPick: 2 });
    expect(errorCode({ result: await attempt({ groups: [optional] }) })).toBeNull();
  });

  it("only accepts choice groups when the type has CHOICES", async () => {
    const context = testContext();
    const { cod } = await createMealSetup({ context });
    const pkg = await createItemType({ context, name: "Package", behaviours: ["COMPOSABLE"] });
    const choiceGroups = [mainCourse({ itemIds: [cod] })];
    const result = await createLunch({ context, entityTypeId: pkg.id, parts: [cod], choiceGroups });
    expect(result.ok ? null : result.error.issues[0]?.path).toBe("choiceGroups");
  });

  it("keeps CHOICES on while choice groups exist", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const choiceGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({
        context,
        entityTypeId: meal.id,
        parts: [cod, veal],
        choiceGroups,
      }),
    });
    const input = { id: meal.id, behaviours: ["COMPOSABLE" as const] };
    const off = () => execute({ operation: updateEntityType, input, context });
    expect(errorCode({ result: await off() })).toBe("CONFLICT");
    const cleared = await execute({
      operation: updateItem,
      input: { id: lunch.id, choiceGroups: [] },
      context,
    });
    unwrap({ result: cleared });
    expect(errorCode({ result: await off() })).toBeNull();
  });

  it("supports choice groups on a customer package and validates the limits", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const customerId = (await createTestCustomer({ context, name: "Acme" })).id;
    const save = ({ maxPick }: { maxPick: number }) =>
      execute({
        operation: saveItemAsPackage,
        input: {
          entityTypeId: meal.id,
          customerId,
          name: "Acme lunch",
          components: [{ itemId: cod }, { itemId: veal }],
          choiceGroups: [mainCourse({ itemIds: [cod, veal], maxPick })],
        },
        context,
      });
    expect(errorCode({ result: await save({ maxPick: 3 }) })).toBe("VALIDATION");
    const saved = unwrap({ result: await save({ maxPick: 2 }) });
    expect(saved.customerId).toBe(customerId);
    expect(saved.choiceGroups).toHaveLength(1);
  });
});
