import { describe, expect, it } from "vitest";
import {
  archiveRole,
  createRole,
  execute,
  getRole,
  importRoleTemplate,
  listRoles,
  updateRole,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const create = ({
  context,
  name,
}: {
  context: Awaited<ReturnType<typeof testOrg>>;
  name: string;
}) =>
  execute({
    operation: createRole,
    input: { name, permissions: { venue: ["admin"], room: ["read"] } },
    context,
  });

describe("role operations (ADR 0014)", () => {
  it("creates normalized roles and lists them after the fixed owner role", async () => {
    const context = await testOrg();
    const role = unwrap({ result: await create({ context, name: "Säljare" }) });
    expect(role.permissions).toEqual({ venue: ["read", "write", "admin"], room: ["read"] });
    const list = unwrap({ result: await execute({ operation: listRoles, input: {}, context }) });
    expect(list.items.map((item) => [item.name, item.system])).toEqual([
      ["owner", true],
      ["Säljare", false],
    ]);
    const owner = unwrap({
      result: await execute({ operation: getRole, input: { id: "owner" }, context }),
    });
    expect(owner.permissions.member).toEqual(["read", "write", "admin"]);
  });

  it("refuses duplicate, reserved and comma names", async () => {
    const context = await testOrg();
    await create({ context, name: "Kök" });
    expect(errorCode({ result: await create({ context, name: "Kök" }) })).toBe("CONFLICT");
    expect(errorCode({ result: await create({ context, name: "owner" }) })).toBe("VALIDATION");
    expect(errorCode({ result: await create({ context, name: "Kök,Admin" }) })).toBe("VALIDATION");
    expect(errorCode({ result: await create({ context, name: "Kök_%" }) })).toBe("VALIDATION");
  });

  it("never lets anyone grant more than they have", async () => {
    const context = await testOrg({ permissions: { role: ["admin"], venue: ["read"] } });
    expect(errorCode({ result: await create({ context, name: "Mer" }) })).toBe("FORBIDDEN");
    const modest = await execute({
      operation: createRole,
      input: { name: "Läs", permissions: { venue: ["read"] } },
      context,
    });
    expect(errorCode({ result: modest })).toBeNull();
  });

  it("keeps owner fixed and renames the role on its members", async () => {
    const context = await testOrg();
    const fixed = await execute({ operation: archiveRole, input: { id: "owner" }, context });
    expect(errorCode({ result: fixed })).toBe("FORBIDDEN");
    const role = unwrap({ result: await create({ context, name: "Kock" }) });
    const memberId = await addTestMember({ context, role: "Kock,Läsare" });
    const renamed = unwrap({
      result: await execute({
        operation: updateRole,
        input: { id: role.id, name: "Kök" },
        context,
      }),
    });
    expect(renamed.name).toBe("Kök");
    const member = await context.db.member.findFirst({ where: { id: memberId } });
    expect(member?.role).toBe("Kök,Läsare");
  });

  it("archives only roles nobody holds, and hides archived roles", async () => {
    const context = await testOrg();
    const held = unwrap({ result: await create({ context, name: "Kök" }) });
    const free = unwrap({ result: await create({ context, name: "Gammal" }) });
    await addTestMember({ context, role: "Kök" });
    const conflict = await execute({ operation: archiveRole, input: { id: held.id }, context });
    expect(errorCode({ result: conflict })).toBe("CONFLICT");
    unwrap({ result: await execute({ operation: archiveRole, input: { id: free.id }, context }) });
    const list = unwrap({ result: await execute({ operation: listRoles, input: {}, context }) });
    expect(list.items.map((item) => item.name)).toEqual(["owner", "Kök"]);
    expect(errorCode({ result: await create({ context, name: "Gammal" }) })).toBeNull();
  });

  it("imports the conference-venue template idempotently", async () => {
    const context = await testOrg();
    const input = { template: "conference-venue" as const };
    const first = unwrap({
      result: await execute({ operation: importRoleTemplate, input, context }),
    });
    expect(first.created.map((role) => role.name)).toEqual([
      "Admin",
      "Säljare",
      "Koordinator",
      "Kök",
      "Ekonomi",
      "Läsare",
    ]);
    const again = unwrap({
      result: await execute({ operation: importRoleTemplate, input, context }),
    });
    expect(again.created).toEqual([]);
    expect(again.skipped).toHaveLength(6);
    // One row per created role, plus one for the no-op second import (every command is audited).
    const audited = await context.db.auditLog.findMany({
      where: { operation: "role.importTemplate", entityType: "role" },
    });
    expect(audited.filter((row) => row.entityId !== null)).toHaveLength(6);
    expect(audited).toHaveLength(7);
  });

  it("is scoped to the organization and to role permissions", async () => {
    const context = await testOrg();
    const role = unwrap({ result: await create({ context, name: "Kök" }) });
    const other = testContext();
    const read = await execute({ operation: getRole, input: { id: role.id }, context: other });
    expect(errorCode({ result: read })).toBe("NOT_FOUND");
    const writer = peer({ of: context, access: "write" });
    const archive = await execute({
      operation: archiveRole,
      input: { id: role.id },
      context: writer,
    });
    expect(errorCode({ result: archive })).toBe("FORBIDDEN");
  });
});
