import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { archiveItem, execute, getMemberProfile, setMemberProfileItems } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { memberProfileSetup } from "./member-profile-helpers";

describe("member profile staff items (ADR 0068)", () => {
  it("links only active staff items: not equipment, not unknown ids", async () => {
    const { context, anna, equipmentId } = await memberProfileSetup();
    const result = await execute({
      operation: setMemberProfileItems,
      input: { memberId: anna, itemIds: [equipmentId, equipmentId, "missing"] },
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    if (result.ok) return;
    expect(result.error.issues.map(({ path }) => path)).toEqual([
      "itemIds.0",
      "itemIds.1",
      "itemIds.2",
    ]);
  });

  it("refuses an item linked to another member with CONFLICT", async () => {
    const { context, anna, bo, tech } = await memberProfileSetup();
    const itemIds = [tech.ids[0] ?? ""];
    unwrap({
      result: await execute({
        operation: setMemberProfileItems,
        input: { memberId: anna, itemIds },
        context,
      }),
    });
    const result = await execute({
      operation: setMemberProfileItems,
      input: { memberId: bo, itemIds },
      context,
    });
    expect(errorCode({ result })).toBe("CONFLICT");
    if (!result.ok) expect(result.error.message).toContain("Technician 1");
  });

  it("replaces the set and keeps links of the same member when repeated", async () => {
    const { context, anna, tech, waiter } = await memberProfileSetup();
    const first = { memberId: anna, itemIds: [tech.ids[0] ?? "", waiter.id] };
    unwrap({ result: await execute({ operation: setMemberProfileItems, input: first, context }) });
    const second = { memberId: anna, itemIds: [waiter.id, waiter.id] };
    const profile = unwrap({
      result: await execute({ operation: setMemberProfileItems, input: second, context }),
    });
    expect(profile.items.map(({ itemId }) => itemId)).toEqual([waiter.id]);
    const cleared = unwrap({
      result: await execute({
        operation: setMemberProfileItems,
        input: { memberId: anna, itemIds: [] },
        context,
      }),
    });
    expect(cleared.items).toEqual([]);
  });

  it("hides an archived item's link and keeps it when the set is replaced", async () => {
    const { context, anna, tech, waiter } = await memberProfileSetup();
    const input = { memberId: anna, itemIds: [tech.ids[0] ?? "", waiter.id] };
    unwrap({ result: await execute({ operation: setMemberProfileItems, input, context }) });
    unwrap({
      result: await execute({ operation: archiveItem, input: { id: tech.ids[0] ?? "" }, context }),
    });
    const profile = unwrap({
      result: await execute({ operation: getMemberProfile, input: { memberId: anna }, context }),
    });
    expect(profile.items.map(({ itemId }) => itemId)).toEqual([waiter.id]);
    const replaced = { memberId: anna, itemIds: [waiter.id] };
    unwrap({
      result: await execute({ operation: setMemberProfileItems, input: replaced, context }),
    });
    const relinked = await execute({
      operation: setMemberProfileItems,
      input: { memberId: anna, itemIds: [tech.ids[0] ?? ""] },
      context,
    });
    expect(errorCode({ result: relinked })).toBe("VALIDATION");
  });

  it("records one audit change per command on the profile", async () => {
    const { context, anna, waiter } = await memberProfileSetup();
    const profile = unwrap({
      result: await execute({
        operation: setMemberProfileItems,
        input: { memberId: anna, itemIds: [waiter.id] },
        context,
      }),
    });
    const rows = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, entityId: profile.id ?? "" },
      select: { entityType: true, operation: true },
    });
    expect(rows).toEqual([{ entityType: "memberProfile", operation: "memberProfile.setItems" }]);
  });
});
