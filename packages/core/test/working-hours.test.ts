import { describe, expect, it } from "vitest";
import { execute, getWorkingHours, setWorkingHours } from "../src/index";
import { DEFAULT_WORKING_HOURS, type WorkingDay } from "../src/schemas";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type Context = ReturnType<typeof testContext>;

const set = ({ context, days }: { context: Context; days: WorkingDay[] }) =>
  execute({ operation: setWorkingHours, input: { days }, context });

const read = async ({ context }: { context: Context }) =>
  unwrap({ result: await execute({ operation: getWorkingHours, input: {}, context }) }).days;

const day = ({ weekday, ...rest }: Partial<WorkingDay> & { weekday: number }): WorkingDay => ({
  weekday,
  startMinute: 480,
  endMinute: 1020,
  breakStartMinute: null,
  breakEndMinute: null,
  ...rest,
});

describe("working hours (ADR 0061)", () => {
  it("replaces all days, returns them sorted and keeps users apart", async () => {
    const a = testContext();
    expect(await read({ context: a })).toEqual([]);
    unwrap({ result: await set({ context: a, days: [...DEFAULT_WORKING_HOURS] }) });
    expect((await read({ context: a })).map(({ weekday }) => weekday)).toEqual([0, 1, 2, 3, 4]);
    unwrap({ result: await set({ context: a, days: [day({ weekday: 5 }), day({ weekday: 2 })] }) });
    expect((await read({ context: a })).map(({ weekday }) => weekday)).toEqual([2, 5]);
    expect(await read({ context: peer({ of: a }) })).toEqual([]);
    unwrap({ result: await set({ context: a, days: [] }) });
    expect(await read({ context: a })).toEqual([]);
  });

  it.each([
    ["a weekday twice", [day({ weekday: 1 }), day({ weekday: 1 })]],
    ["start after end", [day({ weekday: 1, startMinute: 600, endMinute: 540 })]],
    ["an end past midnight", [day({ weekday: 1, endMinute: 1441 })]],
    ["half a break", [day({ weekday: 1, breakStartMinute: 720 })]],
    ["a break outside the day", [day({ weekday: 1, breakStartMinute: 400, breakEndMinute: 500 })]],
    ["a weekday out of range", [day({ weekday: 7 })]],
  ])("refuses %s", async (_label, days) => {
    expect(errorCode({ result: await set({ context: testContext(), days }) })).toBe("VALIDATION");
  });
});
