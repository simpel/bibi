import { describe, expect, it } from "vitest";
import { assignMemberRole, createRole, execute, listMembers } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const withRoles = async () => {
  const context = await testOrg();
  for (const [name, permissions] of [
    ["Kitchen", { venue: ["read"] }],
    ["Head chef", { venue: ["write"] }],
    ["Admin", { role: ["admin"], member: ["admin"], venue: ["admin"] }],
  ] as const) {
    unwrap({
      result: await execute({ operation: createRole, input: { name, permissions }, context }),
    });
  }
  return context;
};

describe("member operations (ADR 0020)", () => {
  it("lists members with roles and filters on the exact role name", async () => {
    const context = await withRoles();
    await addTestMember({ context, role: "owner", name: "Anna" });
    await addTestMember({ context, role: "Head chef", name: "Ali" });
    await addTestMember({ context, role: "Sales,Kitchen", name: "Erik" });
    const all = unwrap({ result: await execute({ operation: listMembers, input: {}, context }) });
    expect(all.items.map((member) => [member.name, member.roles])).toEqual([
      ["Anna", ["owner"]],
      ["Ali", ["Head chef"]],
      ["Erik", ["Sales", "Kitchen"]],
    ]);
    const kitchen = unwrap({
      result: await execute({ operation: listMembers, input: { role: "Kitchen" }, context }),
    });
    expect(kitchen.items.map((member) => member.name)).toEqual(["Erik"]);
  });

  it("assigns existing roles and audits the change", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "Kitchen" });
    const member = unwrap({
      result: await execute({
        operation: assignMemberRole,
        input: { id, roles: ["Head chef"] },
        context,
      }),
    });
    expect(member.roles).toEqual(["Head chef"]);
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.assignRole" },
    });
    expect(audit?.before).toMatchObject({ roles: ["Kitchen"] });
    const unknown = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["Does not exist"] },
      context,
    });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("protects the owner and refuses escalation", async () => {
    const context = await withRoles();
    const ownerId = await addTestMember({ context, role: "owner" });
    const demote = await execute({
      operation: assignMemberRole,
      input: { id: ownerId, roles: ["Kitchen"] },
      context,
    });
    expect(errorCode({ result: demote })).toBe("FORBIDDEN");
    const id = await addTestMember({ context, role: "Kitchen" });
    const promote = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["owner"] },
      context,
    });
    expect(errorCode({ result: promote })).toBe("VALIDATION");
    const limited = testContext({
      organizationId: context.organizationId,
      permissions: { member: ["admin"], venue: ["read"] },
    });
    const escalate = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["Admin"] },
      context: limited,
    });
    expect(errorCode({ result: escalate })).toBe("FORBIDDEN");
  });

  it("never reaches members of another organization", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "Kitchen" });
    const other = await withRoles();
    const list = unwrap({
      result: await execute({ operation: listMembers, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const assign = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["Head chef"] },
      context: other,
    });
    expect(errorCode({ result: assign })).toBe("NOT_FOUND");
  });
});
