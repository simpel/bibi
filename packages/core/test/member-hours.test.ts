import { describe, expect, it } from "vitest";
import { execute, getItemHours, setMemberProfileItems, setWorkingHours } from "../src/index";
import { createUnits } from "./allocation-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { OFFICE_DAYS, runItemHours } from "./hours-helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

const WEEKEND = [5, 6].map((weekday) => ({
  weekday,
  startMinute: 600,
  endMinute: 960,
  breakStartMinute: null,
  breakEndMinute: null,
}));

/** A member who is staffed as Technician 1, with weekend hours set as themself. */
async function staffedMember() {
  const context = await testOrg();
  const { memberId, userId } = await addTestMemberWithUser({ context, role: "member" });
  const units = await createUnits({
    context,
    name: "Technician",
    units: ["Technician 1", "Technician 2"],
    resourceKind: "PERSON",
  });
  const [linked = "", free = ""] = units.ids;
  const input = { memberId, itemIds: [linked] };
  unwrap({ result: await execute({ operation: setMemberProfileItems, input, context }) });
  const self = testContext({
    organizationId: context.organizationId,
    access: "read",
    actor: { type: "user", userId },
  });
  unwrap({
    result: await execute({ operation: setWorkingHours, input: { days: WEEKEND }, context: self }),
  });
  return { context, linked, free };
}

const hoursOf = async ({
  context,
  itemId,
}: {
  context: Awaited<ReturnType<typeof testOrg>>;
  itemId: string;
}) => unwrap({ result: await execute({ operation: getItemHours, input: { itemId }, context }) });

describe("a person's hours live on the member profile (#449)", () => {
  it("shows a linked staff item the member's hours, and keeps an unlinked item's own", async () => {
    const { context, linked, free } = await staffedMember();
    expect((await hoursOf({ context, itemId: linked })).days.map((d) => d.weekday)).toEqual([5, 6]);
    unwrap({ result: await runItemHours({ context, itemId: free, days: OFFICE_DAYS }) });
    expect((await hoursOf({ context, itemId: free })).days.map((d) => d.weekday)).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it("refuses own hours on a linked staff item: one person, one set of hours", async () => {
    const { context, linked } = await staffedMember();
    const refused = await runItemHours({ context, itemId: linked, days: OFFICE_DAYS });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
  });
});
