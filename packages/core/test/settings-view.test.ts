import { describe, expect, it } from "vitest";
import { execute, type SettingKey, updatePaymentSettings, viewSettings } from "../src/index";
import { testContext, unwrap } from "./helpers";

type Context = ReturnType<typeof testContext>;

const view = async ({ context, keys }: { context: Context; keys?: SettingKey[] }) =>
  unwrap({
    result: await execute({ operation: viewSettings, input: keys ? { keys } : {}, context }),
  });

describe("settings view (ADR 0071)", () => {
  it("answers only the asked settings, once each, in the asked order", async () => {
    const admin = testContext();
    unwrap({
      result: await execute({
        operation: updatePaymentSettings,
        input: { depositPercent: 30 },
        context: admin,
      }),
    });
    const asked = await view({ context: admin, keys: ["deposit", "timeZone", "deposit"] });
    expect(asked.keys).toEqual(["deposit", "timeZone"]);
    expect(asked.payment).toMatchObject({ depositPercent: 30 });
    expect(asked.organization?.timeZone).toEqual(expect.any(String));
    expect(asked).toMatchObject({ accounting: null, seats: null });
  });

  it("gives every setting an admin may read when none are asked", async () => {
    const all = await view({ context: testContext() });
    expect(all.keys).toHaveLength(8);
    expect(all.accounting?.fiscalYearStartMonth).toEqual(expect.any(Number));
    expect(all.seats?.included).toEqual(expect.any(Number));
  });

  it("leaves out settings whose feature the caller cannot read", async () => {
    const member = testContext({ role: "member" });
    const asked = await view({ context: member, keys: ["timeZone", "fiscalYear", "seats"] });
    expect(asked.keys).toEqual(["timeZone"]);
    expect(asked).toMatchObject({ accounting: null, seats: null });
  });
});
