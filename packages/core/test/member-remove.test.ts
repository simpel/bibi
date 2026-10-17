import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { execute, removeMember } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const withRoles = testOrg;

describe("member.remove (ADR 0004, 0034)", () => {
  it("removes a member and audits the removed membership", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "viewer", name: "Ali" });
    const removed = unwrap({
      result: await execute({ operation: removeMember, input: { id }, context }),
    });
    expect(removed).toMatchObject({ id, name: "Ali", role: "viewer" });
    expect(await getDb().member.findUnique({ where: { id } })).toBeNull();
    const audit = await context.db.auditLog.findFirst({ where: { operation: "member.remove" } });
    expect(audit).toMatchObject({ entityType: "member", entityId: id });
    expect(audit?.before).toMatchObject({ role: "viewer" });
  });

  it("never removes the last owner, and only an owner removes an owner", async () => {
    const context = await withRoles();
    const ownerId = await addTestMember({ context, role: "owner" });
    const last = await execute({ operation: removeMember, input: { id: ownerId }, context });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const second = await addTestMember({ context, role: "owner" });
    const admin = { ...context, roles: ["admin"] };
    const notOwner = await execute({
      operation: removeMember,
      input: { id: second },
      context: admin,
    });
    expect(errorCode({ result: notOwner })).toBe("FORBIDDEN");
    const owner = context;
    unwrap({
      result: await execute({ operation: removeMember, input: { id: second }, context: owner }),
    });
    const lastAgain = await execute({
      operation: removeMember,
      input: { id: ownerId },
      context: owner,
    });
    expect(errorCode({ result: lastAgain })).toBe("CONFLICT");
  });

  it("refuses to remove a member with more access than the caller", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "admin" });
    const member = { ...context, roles: ["member"] };
    const result = await execute({ operation: removeMember, input: { id }, context: member });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("never reaches members of another organization", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "viewer" });
    const other = await withRoles();
    const result = await execute({ operation: removeMember, input: { id }, context: other });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    expect(await getDb().member.findUnique({ where: { id } })).not.toBeNull();
  });
});
