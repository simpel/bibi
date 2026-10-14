import { describe, expect, it } from "vitest";
import { assignMemberRole, createRole, execute, listMembers } from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const withRoles = async () => {
  const context = await testOrg();
  for (const [name, permissions] of [
    ["Kök", { venue: ["read"] }],
    ["Kökschef", { venue: ["write"] }],
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
    await addTestMember({ context, role: "Kökschef", name: "Ali" });
    await addTestMember({ context, role: "Säljare,Kök", name: "Erik" });
    const all = unwrap({ result: await execute({ operation: listMembers, input: {}, context }) });
    expect(all.items.map((member) => [member.name, member.roles])).toEqual([
      ["Anna", ["owner"]],
      ["Ali", ["Kökschef"]],
      ["Erik", ["Säljare", "Kök"]],
    ]);
    const kitchen = unwrap({
      result: await execute({ operation: listMembers, input: { role: "Kök" }, context }),
    });
    expect(kitchen.items.map((member) => member.name)).toEqual(["Erik"]);
  });

  it("assigns existing roles and audits the change", async () => {
    const context = await withRoles();
    const id = await addTestMember({ context, role: "Kök" });
    const member = unwrap({
      result: await execute({
        operation: assignMemberRole,
        input: { id, roles: ["Kökschef"] },
        context,
      }),
    });
    expect(member.roles).toEqual(["Kökschef"]);
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "member.assignRole" },
    });
    expect(audit?.before).toMatchObject({ roles: ["Kök"] });
    const unknown = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["Finns inte"] },
      context,
    });
    expect(errorCode({ result: unknown })).toBe("VALIDATION");
  });

  it("protects the owner and refuses escalation", async () => {
    const context = await withRoles();
    const ownerId = await addTestMember({ context, role: "owner" });
    const demote = await execute({
      operation: assignMemberRole,
      input: { id: ownerId, roles: ["Kök"] },
      context,
    });
    expect(errorCode({ result: demote })).toBe("FORBIDDEN");
    const id = await addTestMember({ context, role: "Kök" });
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
    const id = await addTestMember({ context, role: "Kök" });
    const other = await withRoles();
    const list = unwrap({
      result: await execute({ operation: listMembers, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const assign = await execute({
      operation: assignMemberRole,
      input: { id, roles: ["Kökschef"] },
      context: other,
    });
    expect(errorCode({ result: assign })).toBe("NOT_FOUND");
  });
});
