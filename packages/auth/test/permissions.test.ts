import { grantAll, PRESET_PERMISSIONS } from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { getAuth, resolveExecuteContext } from "../src/index";
import { createOrg, signUp } from "./helpers";
import { addMember, memberSession } from "./roles";

const resolve = async ({ headers }: { headers: Headers }) => {
  const result = await resolveExecuteContext({ headers });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("preset and override resolution (ADR 0034, 0050)", () => {
  it("resolves the organization creator to admin, with every permission", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const context = await resolve({ headers: owner.headers });
    expect(context.roles).toEqual(["admin"]);
    expect(context.permissions).toEqual(grantAll({}));
  });

  it("resolves each preset to its constant permissions", async () => {
    for (const role of ["member", "manager", "admin"] as const) {
      const { headers } = await memberSession({ role });
      const context = await resolve({ headers });
      expect(context.roles).toEqual([role]);
      expect(context.permissions).toEqual(PRESET_PERMISSIONS[role]);
    }
  });

  it("refuses other role names and lets a stale one grant nothing", async () => {
    await expect(memberSession({ role: "Kitchen" as "member" })).rejects.toThrow(/fixed role/);
    const stale = await memberSession({ role: "manager" });
    await getDb().member.updateMany({
      where: { organizationId: stale.organizationId, userId: stale.user.userId },
      data: { role: "Kitchen" },
    });
    const context = await resolve({ headers: stale.headers });
    expect(context.roles).toEqual([]);
    expect(context.permissions).toEqual({});
  });

  it("closes Better Auth's role-assignment endpoint, even to an admin", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const user = await signUp();
    await addMember({ organizationId, userId: user.userId, role: "member" });
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    const assign = getAuth().api.updateMemberRole({
      headers: owner.headers,
      body: { organizationId, memberId: member.id, role: "admin" },
    });
    await expect(assign).rejects.toThrow(/not allowed/i);
    const after = await getDb().member.findFirstOrThrow({ where: { id: member.id } });
    expect(after.role).toBe("member");
  });

  it("applies a member's overrides live, on the next request", async () => {
    const { headers, user, organizationId } = await memberSession({ role: "member" });
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    await getDb().permissionOverride.create({
      data: {
        organizationId,
        subjectType: "MEMBER",
        subjectId: member.id,
        feature: "item",
        action: "edit",
        effect: "ALLOW",
      },
    });
    const context = await resolve({ headers });
    expect(context.permissions.item).toEqual(["view", "edit"]);
  });
});
