import { grantAll } from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { getAuth, ROLE_PERMISSIONS, resolveExecuteContext } from "../src/index";
import { createOrg, signUp } from "./helpers";
import { addMember, memberSession } from "./roles";

const resolve = async ({ headers }: { headers: Headers }) => {
  const result = await resolveExecuteContext({ headers });
  if (!result.ok) throw result.error;
  return result.value;
};

describe("role resolution (ADR 0034)", () => {
  it("resolves owner to every permission", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const context = await resolve({ headers: owner.headers });
    expect(context.roles).toEqual(["owner"]);
    expect(context.permissions).toEqual(grantAll({ upTo: "admin" }));
  });

  it("resolves each fixed role to its constant permissions", async () => {
    for (const role of ["viewer", "member", "admin"] as const) {
      const { headers } = await memberSession({ role });
      const context = await resolve({ headers });
      expect(context.roles).toEqual([role]);
      expect(context.permissions).toEqual(ROLE_PERMISSIONS[role]);
    }
  });

  it("refuses other role names and lets a stale one grant nothing", async () => {
    await expect(memberSession({ role: "Kitchen" as "viewer" })).rejects.toThrow(/fixed role/);
    const stale = await memberSession({ role: "member" });
    await getDb().member.updateMany({
      where: { organizationId: stale.organizationId, userId: stale.user.userId },
      data: { role: "Kitchen" },
    });
    const context = await resolve({ headers: stale.headers });
    expect(context.roles).toEqual([]);
    expect(context.permissions).toEqual({});
  });

  it("closes Better Auth's role-assignment endpoint, even to the owner", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const user = await signUp();
    await addMember({ organizationId, userId: user.userId, role: "viewer" });
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    const assign = getAuth().api.updateMemberRole({
      headers: owner.headers,
      body: { organizationId, memberId: member.id, role: "owner" },
    });
    await expect(assign).rejects.toThrow(/not allowed/i);
    const after = await getDb().member.findFirstOrThrow({ where: { id: member.id } });
    expect(after.role).toBe("viewer");
  });
});
