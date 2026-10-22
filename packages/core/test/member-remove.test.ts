import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { execute, removeMember } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const withRoles = testOrg;

describe("member.remove (ADR 0004, 0034)", () => {
  it("removes a member and audits the removed membership", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "member", name: "Ali" });
    const removed = unwrap({
      result: await execute({ operation: removeMember, input: { id }, context }),
    });
    expect(removed).toMatchObject({ id, name: "Ali", role: "member" });
    expect(await getDb().member.findUnique({ where: { id } })).toBeNull();
    const audit = await context.db.auditLog.findFirst({ where: { operation: "member.remove" } });
    expect(audit).toMatchObject({ entityType: "member", entityId: id });
    expect(audit?.before).toMatchObject({ role: "member" });
  });

  it("never removes the last admin, but an admin removes another admin", async () => {
    const context = await withRoles();
    const adminId = await addTestMember({ context, role: "admin" });
    const last = await execute({ operation: removeMember, input: { id: adminId }, context });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const second = await addTestMember({ context, role: "admin" });
    const admin = { ...context, roles: ["admin"] };
    unwrap({
      result: await execute({ operation: removeMember, input: { id: second }, context: admin }),
    });
    const lastAgain = await execute({
      operation: removeMember,
      input: { id: adminId },
      context: admin,
    });
    expect(errorCode({ result: lastAgain })).toBe("CONFLICT");
  });

  it("refuses to remove a member with more access than the caller", async () => {
    const context = await withRoles();
    await addTestMember({ context, role: "admin" });
    const id = await addTestMember({ context, role: "admin" });
    const member = { ...context, roles: ["manager"] };
    const result = await execute({ operation: removeMember, input: { id }, context: member });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("never reaches members of another organization", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "member" });
    const other = await withRoles();
    const result = await execute({ operation: removeMember, input: { id }, context: other });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    expect(await getDb().member.findUnique({ where: { id } })).not.toBeNull();
  });
});
