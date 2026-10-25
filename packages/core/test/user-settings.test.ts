import { describe, expect, it } from "vitest";
import {
  execute,
  getUserSettings,
  type UserSettingsUpdateInput,
  updateUserSettings,
} from "../src/index";
import { testContext, unwrap } from "./helpers";

type Context = ReturnType<typeof testContext>;

const read = async ({ context }: { context: Context }) =>
  unwrap({ result: await execute({ operation: getUserSettings, input: {}, context }) });

describe("user settings (ADR 0046)", () => {
  it("reads defaults before any change, keeps omitted fields and keeps users apart", async () => {
    const a = testContext();
    const b = testContext();
    expect(await read({ context: a })).toMatchObject({ id: null, dateFormat: null });
    const update = ({ input }: { input: UserSettingsUpdateInput }) =>
      execute({ operation: updateUserSettings, input, context: a });
    unwrap({ result: await update({ input: { dateFormat: "YYYY_MM_DD" } }) });
    unwrap({ result: await update({ input: { clockFormat: "H12" } }) });
    expect(await read({ context: a })).toMatchObject({
      dateFormat: "YYYY_MM_DD",
      clockFormat: "H12",
    });
    unwrap({ result: await update({ input: { dateFormat: null } }) });
    expect(await read({ context: a })).toMatchObject({ dateFormat: null, clockFormat: "H12" });
    expect(await read({ context: b })).toMatchObject({ id: null, clockFormat: null });
    unwrap({
      result: await update({ input: { numberFormat: "COMMA_DOT", currencyDisplay: "CODE" } }),
    });
    expect(await read({ context: a })).toMatchObject({
      clockFormat: "H12",
      numberFormat: "COMMA_DOT",
      currencyDisplay: "CODE",
    });
    unwrap({ result: await update({ input: { currencyDisplay: null } }) });
    expect(await read({ context: a })).toMatchObject({
      numberFormat: "COMMA_DOT",
      currencyDisplay: null,
    });
  });

  it("refuses a format it does not know", async () => {
    const input = { dateFormat: "DD.MM.YY" } as never;
    const result = await execute({ operation: updateUserSettings, input, context: testContext() });
    expect(result.ok).toBe(false);
  });
});
