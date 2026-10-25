import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  execute,
  getMemberProfile,
  listMemberProfiles,
  setMemberProfileItems,
  updateMemberProfile,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { memberProfileSetup } from "./member-profile-helpers";
import { addTestMember, testOrg } from "./org-helpers";

describe("member profiles (ADR 0068)", () => {
  it("reads defaults until saved, then keeps the schedule kind", async () => {
    const { context, anna } = await memberProfileSetup();
    const empty = unwrap({
      result: await execute({ operation: getMemberProfile, input: { memberId: anna }, context }),
    });
    expect(empty).toEqual({ id: null, memberId: anna, scheduleKind: "PATTERN", items: [] });
    const input = { memberId: anna, scheduleKind: "SHIFTS" as const };
    const saved = unwrap({
      result: await execute({ operation: updateMemberProfile, input, context }),
    });
    expect(saved.id).not.toBeNull();
    expect(saved.scheduleKind).toBe("SHIFTS");
    const again = unwrap({
      result: await execute({ operation: getMemberProfile, input: { memberId: anna }, context }),
    });
    expect(again).toEqual(saved);
  });

  it("lists positions as the types of the linked staff items, and who is behind an item", async () => {
    const { context, anna, bo, tech, waiter } = await memberProfileSetup();
    const input = { memberId: anna, itemIds: [waiter.id, tech.ids[0] ?? ""] };
    const profile = unwrap({
      result: await execute({ operation: setMemberProfileItems, input, context }),
    });
    expect(profile.items.map(({ name, entityTypeId }) => [name, entityTypeId])).toEqual([
      ["Technician 1", tech.typeId],
      ["Waiter 1", waiter.typeId],
    ]);
    const boInput = { memberId: bo, itemIds: [tech.ids[1] ?? ""] };
    unwrap({
      result: await execute({ operation: setMemberProfileItems, input: boInput, context }),
    });
    const behind = unwrap({
      result: await execute({
        operation: listMemberProfiles,
        input: { limit: 50, itemIds: [tech.ids[1] ?? ""] },
        context,
      }),
    });
    expect(behind.items.map(({ memberId }) => memberId)).toEqual([bo]);
  });

  it("needs item:write to change, item:read to read", async () => {
    const { context, anna } = await memberProfileSetup();
    const reader = peer({ of: context, access: "read" });
    const read = await execute({
      operation: getMemberProfile,
      input: { memberId: anna },
      context: reader,
    });
    expect(errorCode({ result: read })).toBeNull();
    const input = { memberId: anna, scheduleKind: "CASUAL" as const };
    expect(
      errorCode({
        result: await execute({ operation: updateMemberProfile, input, context: reader }),
      }),
    ).toBe("FORBIDDEN");
    const manager = peer({ of: context, access: "write" });
    expect(
      errorCode({
        result: await execute({ operation: updateMemberProfile, input, context: manager }),
      }),
    ).toBeNull();
  });

  it("refuses another organization's member with NOT_FOUND", async () => {
    const { anna } = await memberProfileSetup();
    const other = await testOrg();
    await addTestMember({ context: other, role: "member" });
    const result = await execute({
      operation: getMemberProfile,
      input: { memberId: anna },
      context: other,
    });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    const input = { memberId: anna, scheduleKind: "CASUAL" as const };
    expect(
      errorCode({
        result: await execute({ operation: updateMemberProfile, input, context: other }),
      }),
    ).toBe("NOT_FOUND");
  });

  it("is removed with the member, and the staff items stay", async () => {
    const { context, anna, tech } = await memberProfileSetup();
    const input = { memberId: anna, itemIds: [tech.ids[0] ?? ""] };
    unwrap({ result: await execute({ operation: setMemberProfileItems, input, context }) });
    await getDb().member.delete({ where: { id: anna } });
    expect(await getDb().memberProfile.count({ where: { memberId: anna } })).toBe(0);
    expect(await getDb().memberProfileItem.count({ where: { itemId: tech.ids[0] ?? "" } })).toBe(0);
    expect(await getDb().item.count({ where: { id: tech.ids[0] ?? "", status: "ACTIVE" } })).toBe(
      1,
    );
  });
});
