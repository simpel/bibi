import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import { createRole, execute, removeMember } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const withRoles = async () => {
  const context = await testOrg();
  for (const [name, permissions] of [
    ["Kitchen", { venue: ["read"] }],
    ["Admin", { member: ["admin"], venue: ["admin"] }],
  ] as const) {
    unwrap({
      result: await execute({ operation: createRole, input: { name, permissions }, context }),
    });
  }
  return context;
};

describe("member.remove (ADR 0004, 0020)", () => {
  it("removes a member and audits the removed membership", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "Kitchen", name: "Ali" });
    const removed = unwrap({
      result: await execute({ operation: removeMember, input: { id }, context }),
    });
    expect(removed).toMatchObject({ id, name: "Ali", roles: ["Kitchen"] });
    expect(await getDb().member.findUnique({ where: { id } })).toBeNull();
    const audit = await context.db.auditLog.findFirst({ where: { operation: "member.remove" } });
    expect(audit).toMatchObject({ entityType: "member", entityId: id });
    expect(audit?.before).toMatchObject({ roles: ["Kitchen"] });
  });

  it("never removes the last owner, and only an owner removes an owner", async () => {
    const context = await withRoles();
    const ownerId = await addTestMember({ context, role: "owner" });
    const last = await execute({ operation: removeMember, input: { id: ownerId }, context });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const second = await addTestMember({ context, role: "owner" });
    const notOwner = await execute({ operation: removeMember, input: { id: second }, context });
    expect(errorCode({ result: notOwner })).toBe("FORBIDDEN");
    const owner = { ...context, roles: ["owner"] };
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
    const id = await addTestMember({ context, role: "Admin" });
    const limited = testContext({
      organizationId: context.organizationId,
      permissions: { member: ["admin"], venue: ["read"] },
    });
    const result = await execute({ operation: removeMember, input: { id }, context: limited });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });

  it("never reaches members of another organization", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "Kitchen" });
    const other = await withRoles();
    const result = await execute({ operation: removeMember, input: { id }, context: other });
    expect(errorCode({ result })).toBe("NOT_FOUND");
    expect(await getDb().member.findUnique({ where: { id } })).not.toBeNull();
  });
});
