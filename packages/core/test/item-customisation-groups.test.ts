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

describe("item customisation groups (ADR 0021)", () => {
  it("creates and edits a bundle with selectable options", async () => {
    const context = testContext();
    const { meal, cod, veal, salad } = await createMealSetup({ context });
    const parts = [salad, cod, veal];
    const customisationGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({ context, entityTypeId: meal.id, parts, customisationGroups }),
    });
    same({ a: lunch.customisationGroups, b: customisationGroups });
    const update = ({ input }: { input: Omit<z.input<typeof ItemUpdateInputSchema>, "id"> }) =>
      execute({ operation: updateItem, input: { id: lunch.id, ...input }, context });
    const wider = [mainCourse({ itemIds: parts, maxPick: 2 })];
    same({
      a: unwrap({ result: await update({ input: { customisationGroups: wider } }) })
        .customisationGroups,
      b: wider,
    });
    // Changing only the parts keeps the groups, as long as the options are still parts.
    const doubled = parts.map((itemId) => ({ itemId, quantity: 2 }));
    const kept = unwrap({ result: await update({ input: { parts: doubled } }) });
    same({ a: kept.customisationGroups, b: wider });
    const dropped = await update({ input: { parts: [{ itemId: cod }] } });
    expect(dropped.ok ? null : dropped.error.issues[0]?.path).toBe("customisationGroups");
    const read = await execute({ operation: getItem, input: { id: lunch.id }, context });
    same({ a: unwrap({ result: read }).customisationGroups, b: wider });
  });

  it("validates 0 <= minPick <= maxPick <= number of options", async () => {
    const context = testContext();
    const { meal, cod, veal, salad } = await createMealSetup({ context });
    const attempt = ({
      groups,
      parts = [cod, veal, salad],
    }: {
      groups: ItemCustomisationGroupInput[];
      parts?: string[];
    }) => createLunch({ context, entityTypeId: meal.id, parts, customisationGroups: groups });
    const invalid: ItemCustomisationGroupInput[][] = [
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

  it("only accepts customisation groups when the type has CUSTOMISATIONS", async () => {
    const context = testContext();
    const { cod } = await createMealSetup({ context });
    const pkg = await createItemType({ context, name: "Bundle", capabilities: ["BUNDLE"] });
    const customisationGroups = [mainCourse({ itemIds: [cod] })];
    const result = await createLunch({
      context,
      entityTypeId: pkg.id,
      parts: [cod],
      customisationGroups,
    });
    expect(result.ok ? null : result.error.issues[0]?.path).toBe("customisationGroups");
  });

  it("keeps CUSTOMISATIONS on while customisation groups exist", async () => {
    const context = testContext();
    const { meal, cod, veal } = await createMealSetup({ context });
    const customisationGroups = [mainCourse({ itemIds: [cod, veal] })];
    const lunch = unwrap({
      result: await createLunch({
        context,
        entityTypeId: meal.id,
        parts: [cod, veal],
        customisationGroups,
      }),
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
          parts: [{ itemId: cod }, { itemId: veal }],
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
