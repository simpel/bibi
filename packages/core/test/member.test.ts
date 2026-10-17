import { describe, expect, it } from "vitest";
import { assignMemberRole, type ExecuteContext, execute, listMembers } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const assign = ({ context, id, role }: { context: ExecuteContext; id: string; role: string }) =>
  execute({ operation: assignMemberRole, input: { id, role: role as "member" }, context });

describe("member operations (ADR 0034)", () => {
  it("lists members with their fixed role and filters on it", async () => {
    const context = await testOrg();
    await addTestMember({ context, role: "owner", name: "Anna" });
    await addTestMember({ context, role: "member", name: "Ali" });
    await addTestMember({ context, role: "Sales,Kitchen", name: "Erik" });
    const all = unwrap({ result: await execute({ operation: listMembers, input: {}, context }) });
    expect(all.items.map((member) => [member.name, member.role])).toEqual([
      ["Anna", "owner"],
      ["Ali", "member"],
      ["Erik", null],
    ]);
    const members = unwrap({
      result: await execute({ operation: listMembers, input: { role: "member" }, context }),
    });
    expect(members.items.map((member) => member.name)).toEqual(["Ali"]);
  });

  it("assigns a fixed role, audits it and rejects other names", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "viewer" });
    const member = unwrap({ result: await assign({ context, id, role: "admin" }) });
    expect(member.role).toBe("admin");
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.assignRole" },
    });
    expect(audit?.before).toMatchObject({ role: "viewer" });
    expect(audit?.after).toMatchObject({ role: "admin" });
    const unknown = await assign({ context, id, role: "Kitchen" });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("never gives a role above the caller's own nor changes someone above them", async () => {
    const context = await testOrg();
    const admin = { ...context, roles: ["admin"] };
    const id = await addTestMember({ context, role: "member" });
    expect(errorCode({ result: await assign({ context: admin, id, role: "owner" }) })).toBe(
      "FORBIDDEN",
    );
    unwrap({ result: await assign({ context: admin, id, role: "admin" }) });
    const ownerId = await addTestMember({ context, role: "owner" });
    await addTestMember({ context, role: "owner" });
    const demote = await assign({ context: admin, id: ownerId, role: "viewer" });
    expect(errorCode({ result: demote })).toBe("FORBIDDEN");
    const viaMember = await assign({
      context: { ...context, roles: ["member"] },
      id,
      role: "viewer",
    });
    expect(errorCode({ result: viaMember })).toBe("FORBIDDEN");
  });

  it("lets an owner promote and demote owners but keeps the last one", async () => {
    const context = await testOrg();
    const ownerId = await addTestMember({ context, role: "owner" });
    const last = await assign({ context, id: ownerId, role: "admin" });
    expect(errorCode({ result: last })).toBe("CONFLICT");
    const id = await addTestMember({ context, role: "member" });
    unwrap({ result: await assign({ context, id, role: "owner" }) });
    const demoted = unwrap({ result: await assign({ context, id: ownerId, role: "admin" }) });
    expect(demoted.role).toBe("admin");
  });

  it("never reaches members of another organization", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "viewer" });
    const other = await testOrg();
    const list = unwrap({
      result: await execute({ operation: listMembers, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const result = await assign({ context: other, id, role: "member" });
    expect(errorCode({ result })).toBe("NOT_FOUND");
  });
});
