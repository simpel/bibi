import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { execute, getWorkingHours, setWorkingHours } from "../src/index";
import { DEFAULT_WORKING_HOURS, type WorkingDay } from "../src/schemas";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

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

/** A real member of a fresh organization, acting as themself. */
async function member() {
  const org = await testOrg();
  const { userId } = await addTestMemberWithUser({ context: org, role: "member" });
  const actor = { type: "user" as const, userId };
  return testContext({ organizationId: org.organizationId, access: "read", actor });
}

/** The same user as a member of one more organization. */
async function alsoIn({ of }: { of: Context }) {
  const org = await testOrg();
  const userId = of.actor.userId ?? "";
  const data = { id: createId(), organizationId: org.organizationId, userId, role: "member" };
  await getDb().member.create({ data: { ...data, createdAt: new Date() } });
  return testContext({ organizationId: org.organizationId, access: "read", actor: of.actor });
}

describe("working hours (ADR 0061, kept per organization by #449)", () => {
  it("replaces all days, returns them sorted and keeps users apart", async () => {
    const a = await member();
    expect(await read({ context: a })).toEqual([]);
    unwrap({ result: await set({ context: a, days: [...DEFAULT_WORKING_HOURS] }) });
    expect((await read({ context: a })).map(({ weekday }) => weekday)).toEqual([0, 1, 2, 3, 4]);
    unwrap({ result: await set({ context: a, days: [day({ weekday: 5 }), day({ weekday: 2 })] }) });
    expect((await read({ context: a })).map(({ weekday }) => weekday)).toEqual([2, 5]);
    expect(await read({ context: await member() })).toEqual([]);
    unwrap({ result: await set({ context: a, days: [] }) });
    expect(await read({ context: a })).toEqual([]);
  });

  it("keeps each organization's hours apart for one person", async () => {
    const lindholmen = await member();
    const vingaleden = await alsoIn({ of: lindholmen });
    unwrap({ result: await set({ context: lindholmen, days: [...DEFAULT_WORKING_HOURS] }) });
    unwrap({ result: await set({ context: vingaleden, days: [day({ weekday: 5 })] }) });
    expect((await read({ context: lindholmen })).map(({ weekday }) => weekday)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect((await read({ context: vingaleden })).map(({ weekday }) => weekday)).toEqual([5]);
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
