import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { deleteOrganizations } from "../src/seed/demo/delete-organizations";
import { findTestLeftoverOrgs } from "../src/seed/demo/test-leftovers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

describe("test leftover cleanup", () => {
  it("finds organizations with only test-domain members and keeps one with a real member", async () => {
    const db = getDb();
    const leftover = await testOrg();
    await addTestMemberWithUser({ context: leftover, role: "member" });
    const real = await testOrg();
    const { userId } = await addTestMemberWithUser({ context: real, role: "member" });
    await db.user.update({ where: { id: userId }, data: { email: `${userId}@venue.se` } });

    const found = await findTestLeftoverOrgs({ db });
    expect(found).toContain(leftover.organizationId);
    expect(found).not.toContain(real.organizationId);

    await deleteOrganizations({ db, organizationIds: [leftover.organizationId] });
    expect(await db.organization.count({ where: { id: leftover.organizationId } })).toBe(0);
    expect(await db.member.count({ where: { organizationId: leftover.organizationId } })).toBe(0);

    await deleteOrganizations({ db, organizationIds: [real.organizationId] });
    await db.user.delete({ where: { id: userId } });
  });
});
