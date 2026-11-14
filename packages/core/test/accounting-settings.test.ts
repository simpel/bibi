import { describe, expect, it } from "vitest";
import { revenueAccountResolver } from "../src/features/finance/account-map";
import { effectiveRevenueAccount } from "../src/features/finance/settings-schema";
import {
  createEntityType,
  type ExecuteContext,
  execute,
  getAccountingSettings,
  updateAccountingSettings,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";

const update = ({ context, input }: { context: ExecuteContext; input: object }) =>
  execute({ operation: updateAccountingSettings, input, context });

async function itemType({ context }: { context: ExecuteContext }) {
  const input = { base: "ITEM" as const, name: "Rooms", capabilities: ["PRICED" as const] };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

describe("accounting settings (ADR 0077)", () => {
  it("reads the BAS defaults until saved, then keeps what is not changed", async () => {
    const context = testContext();
    const before = unwrap({
      result: await execute({ operation: getAccountingSettings, input: {}, context }),
    });
    expect(before).toMatchObject({ id: null, advancesAccount: "2420", revenueAccount: "3001" });
    const type = await itemType({ context });
    const revenueAccounts = [
      { entityTypeId: type.id, itemId: null, account: "3041", isDefault: false },
    ];
    const saved = unwrap({
      result: await update({ context, input: { revenueAccount: "3041", revenueAccounts } }),
    });
    expect(saved).toMatchObject({
      revenueAccount: "3041",
      advancesAccount: "2420",
      revenueAccounts,
    });
    const kept = unwrap({ result: await update({ context, input: { advancesAccount: "2421" } }) });
    expect(kept.revenueAccounts).toEqual(revenueAccounts);
    const cleared = unwrap({ result: await update({ context, input: { revenueAccounts: [] } }) });
    expect(cleared.revenueAccounts).toEqual([]);
  });

  it("refuses bad account numbers, a mapping with two targets and a member without finance", async () => {
    const context = testContext();
    const type = await itemType({ context });
    const both = [{ entityTypeId: type.id, itemId: type.id, account: "3041" }];
    const twice = [
      { entityTypeId: type.id, itemId: null, account: "3041" },
      { entityTypeId: type.id, itemId: null, account: "3042" },
    ];
    const twoDefaults = [
      { entityTypeId: type.id, itemId: null, account: "3041", isDefault: true },
      { entityTypeId: null, itemId: type.id, account: "3042", isDefault: true },
    ];
    for (const input of [
      { advancesAccount: "24" },
      { revenueAccounts: both },
      { revenueAccounts: twice },
      { revenueAccounts: twoDefaults },
    ]) {
      expect(errorCode({ result: await update({ context, input }) }), JSON.stringify(input)).toBe(
        "VALIDATION",
      );
    }
    const member = testContext({ organizationId: context.organizationId, access: "read" });
    const read = await execute({ operation: getAccountingSettings, input: {}, context: member });
    expect(errorCode({ result: read })).toBe("FORBIDDEN");
  });
});

describe("one default revenue row (ADR 0109)", () => {
  async function twoTypes({ context }: { context: ExecuteContext }) {
    const make = async ({ name }: { name: string }) =>
      unwrap({
        result: await execute({
          operation: createEntityType,
          input: { base: "ITEM" as const, name, capabilities: ["PRICED" as const] },
          context,
        }),
      });
    return { dish: await make({ name: "Dish" }), meal: await make({ name: "Meal" }) };
  }

  const rows = ({
    dish,
    meal,
    defaultId,
  }: {
    dish: string;
    meal: string;
    defaultId: string | null;
  }) => [
    { entityTypeId: dish, itemId: null, account: "3051", isDefault: dish === defaultId },
    { entityTypeId: meal, itemId: null, account: "3051", isDefault: meal === defaultId },
  ];

  it("marks one of two rows with the same account, switches it, and goes back to the base account", async () => {
    const context = testContext();
    const { dish, meal } = await twoTypes({ context });
    const first = unwrap({
      result: await update({
        context,
        input: { revenueAccounts: rows({ dish: dish.id, meal: meal.id, defaultId: meal.id }) },
      }),
    });
    expect(
      first.revenueAccounts.filter((row) => row.isDefault).map((row) => row.entityTypeId),
    ).toEqual([meal.id]);
    expect(effectiveRevenueAccount({ settings: first })).toBe("3051");
    const switched = unwrap({
      result: await update({
        context,
        input: { revenueAccounts: rows({ dish: dish.id, meal: meal.id, defaultId: dish.id }) },
      }),
    });
    expect(
      switched.revenueAccounts.filter((row) => row.isDefault).map((row) => row.entityTypeId),
    ).toEqual([dish.id]);
    const base = unwrap({
      result: await update({
        context,
        input: { revenueAccounts: rows({ dish: dish.id, meal: meal.id, defaultId: null }) },
      }),
    });
    expect(effectiveRevenueAccount({ settings: base })).toBe("3001");
  });

  it("gives an item and a type without their own account the default row's account", async () => {
    const context = testContext();
    const { dish, meal } = await twoTypes({ context });
    const settings = unwrap({
      result: await update({
        context,
        input: {
          revenueAccounts: [
            { entityTypeId: dish.id, itemId: null, account: "3051", isDefault: false },
            { entityTypeId: meal.id, itemId: null, account: "3099", isDefault: true },
          ],
        },
      }),
    });
    const accountOf = revenueAccountResolver({ settings });
    const line = ({ entityTypeId }: { entityTypeId: string | null }) => ({
      itemId: entityTypeId ? "i" : null,
      vatRows: [],
      item: entityTypeId ? { entityTypeId } : null,
    });
    expect(accountOf({ line: line({ entityTypeId: dish.id }) })).toBe("3051");
    expect(accountOf({ line: line({ entityTypeId: "unmapped" }) })).toBe("3099");
    expect(accountOf({ line: line({ entityTypeId: null }) })).toBe("3099");
  });
});
