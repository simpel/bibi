import { archiveRole, createExecuteContext, execute, grantAll, listRoles } from "@okazi/core";
import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { getAuth, resolveExecuteContext } from "../src/index";
import { codeOf, createOrg, signIn, signUp } from "./helpers";
import { addMember, addRole, READ_ONLY } from "./roles";

const system = ({ organizationId }: { organizationId: string }) =>
  createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
  });

const memberSession = async ({ role }: { role: string }) => {
  const owner = await signUp();
  const organizationId = await createOrg({ headers: owner.headers });
  await addRole({ organizationId, name: "Läs", permissions: READ_ONLY });
  const user = await signUp();
  await addMember({ organizationId, userId: user.userId, role });
  const headers = await signIn({ email: user.email });
  return { organizationId, headers };
};

describe("role resolution (ADR 0020)", () => {
  it("resolves owner to every permission", async () => {
    const owner = await signUp();
    await createOrg({ headers: owner.headers });
    const result = await resolveExecuteContext({ headers: owner.headers });
    if (!result.ok) throw result.error;
    expect(result.value.permissions).toEqual(grantAll({ upTo: "admin" }));
  });

  it("resolves a custom role to its normalized permissions", async () => {
    const { headers } = await memberSession({ role: "Läs" });
    const result = await resolveExecuteContext({ headers });
    if (!result.ok) throw result.error;
    expect(result.value.roles).toEqual(["Läs"]);
    expect(result.value.permissions).toEqual({ venue: ["read"], room: ["read"] });
  });

  it("grants nothing for unknown or archived roles, but the member is still resolved", async () => {
    const { organizationId, headers } = await memberSession({ role: "Läs" });
    const roles = await execute({
      operation: listRoles,
      input: {},
      context: system({ organizationId }),
    });
    if (!roles.ok) throw roles.error;
    const id = roles.value.items.find((role) => role.name === "Läs")?.id ?? "";
    // Archiving is refused while the member holds it: the role stays in force.
    const refused = await execute({
      operation: archiveRole,
      input: { id },
      context: system({ organizationId }),
    });
    expect(codeOf({ result: refused })).toBe("CONFLICT");
    // Better Auth refuses unknown role names; a stale name in the row still grants nothing.
    await expect(memberSession({ role: "Finns inte" })).rejects.toThrow(/Unknown role/);
    const stale = await memberSession({ role: "Läs" });
    await getDb().member.updateMany({
      where: { organizationId: stale.organizationId, role: "Läs" },
      data: { role: "Finns inte" },
    });
    const result = await resolveExecuteContext({ headers: stale.headers });
    if (!result.ok) throw result.error;
    expect(result.value.permissions).toEqual({});
    expect(await resolveExecuteContext({ headers })).toMatchObject({ ok: true });
  });

  it("closes Better Auth's own role and role-assignment endpoints, even to the owner", async () => {
    const owner = await signUp();
    const organizationId = await createOrg({ headers: owner.headers });
    const api = getAuth().api;
    const createRole = api.createOrgRole({
      headers: owner.headers,
      body: { organizationId, role: "Bakväg", permission: { venue: ["admin"] } },
    });
    await expect(createRole).rejects.toThrow(/not allowed/i);
    await addRole({ organizationId, name: "Läs", permissions: READ_ONLY });
    const user = await signUp();
    await addMember({ organizationId, userId: user.userId, role: "Läs" });
    const member = await getDb().member.findFirstOrThrow({
      where: { organizationId, userId: user.userId },
    });
    const assign = api.updateMemberRole({
      headers: owner.headers,
      body: { organizationId, memberId: member.id, role: "owner" },
    });
    await expect(assign).rejects.toThrow(/not allowed/i);
    const after = await getDb().member.findFirstOrThrow({ where: { id: member.id } });
    expect(after.role).toBe("Läs");
  });
});
