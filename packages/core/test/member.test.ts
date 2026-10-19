import { describe, expect, it } from "vitest";
import {
  assignMemberRole,
  type ExecuteContext,
  execute,
  getMember,
  listMembers,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const assign = ({ context, id, role }: { context: ExecuteContext; id: string; role: string }) =>
  execute({ operation: assignMemberRole, input: { id, role: role as "manager" }, context });

describe("member operations (ADR 0034)", () => {
  it("lists members with their fixed role and filters on it", async () => {
    const context = await testOrg();
    await addTestMember({ context, role: "admin", name: "Anna" });
    await addTestMember({ context, role: "manager", name: "Ali" });
    await addTestMember({ context, role: "Sales,Kitchen", name: "Erik" });
    const all = unwrap({ result: await execute({ operation: listMembers, input: {}, context }) });
    expect(all.items.map((member) => [member.name, member.role])).toEqual([
      ["Anna", "admin"],
      ["Ali", "manager"],
      ["Erik", null],
    ]);
    const members = unwrap({
      result: await execute({ operation: listMembers, input: { role: "manager" }, context }),
    });
    expect(members.items.map((member) => member.name)).toEqual(["Ali"]);
  });

  it("reads one member and hides another organization's member", async () => {
    const context = await testOrg();
    const other = await testOrg();
    const id = await addTestMember({ context, role: "manager", name: "Ali" });
    const member = unwrap({
      result: await execute({ operation: getMember, input: { id }, context }),
    });
    expect(member).toMatchObject({ id, name: "Ali", role: "manager" });
    const crossOrg = await execute({ operation: getMember, input: { id }, context: other });
    expect(errorCode({ result: crossOrg })).toBe("NOT_FOUND");
    const unknown = await execute({ operation: getMember, input: { id: "nope" }, context });
    expect(errorCode({ result: unknown })).toBe("NOT_FOUND");
  });

  it("assigns a fixed role, audits it and rejects other names", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "member" });
    const member = unwrap({ result: await assign({ context, id, role: "admin" }) });
    expect(member.role).toBe("admin");
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.assignRole" },
    });
    expect(audit?.before).toMatchObject({ role: "member" });
    expect(audit?.after).toMatchObject({ role: "admin" });
    const unknown = await assign({ context, id, role: "Kitchen" });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("never gives a role above the caller's own nor changes someone above them", async () => {
    const context = await testOrg();
    const manager = { ...context, roles: ["manager"] };
    const id = await addTestMember({ context, role: "member" });
    expect(errorCode({ result: await assign({ context: manager, id, role: "admin" }) })).toBe(
      "FORBIDDEN",
    );
    unwrap({ result: await assign({ context: manager, id, role: "manager" }) });
    const adminId = await addTestMember({ context, role: "admin" });
    await addTestMember({ context, role: "admin" });
    const demote = await assign({ context: manager, id: adminId, role: "member" });
    expect(errorCode({ result: demote })).toBe("FORBIDDEN");
  });

  it("lets an admin promote and demote admins but keeps the last one", async () => {
    const context = await testOrg();
    const adminId = await addTestMember({ context, role: "admin" });
    const last = await assign({ context, id: adminId, role: "manager" });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const id = await addTestMember({ context, role: "manager" });
    unwrap({ result: await assign({ context, id, role: "admin" }) });
    const demoted = unwrap({ result: await assign({ context, id: adminId, role: "manager" }) });
    expect(demoted.role).toBe("manager");
  });

  it("never reaches members of another organization", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "member" });
    const other = await testOrg();
    const list = unwrap({
      result: await execute({ operation: listMembers, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const result = await assign({ context: other, id, role: "manager" });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});
