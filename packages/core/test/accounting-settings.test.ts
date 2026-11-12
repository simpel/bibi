import { describe, expect, it } from "vitest";
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
    const revenueAccounts = [{ entityTypeId: type.id, itemId: null, account: "3041" }];
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
    for (const input of [
      { advancesAccount: "24" },
      { revenueAccounts: both },
      { revenueAccounts: twice },
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
