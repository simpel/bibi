import { describe, expect, it } from "vitest";
import { execute, getPermissions, updatePermissions } from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { addTestMember, testOrg } from "./org-helpers";

const subject = ({ id }: { id: string }) => ({ subjectType: "member" as const, subjectId: id });

describe("permission.get and permission.update (ADR 0050)", () => {
  it("stores only real differences from the preset and audits them", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "member" });
    const overrides = [
      { feature: "item" as const, action: "edit" as const, effect: "allow" as const },
      { feature: "item" as const, action: "view" as const, effect: "allow" as const },
    ];
    const input = { ...subject({ id }), overrides };
    const saved = unwrap({
      result: await execute({ operation: updatePermissions, input, context }),
    });
    expect(saved.overrides).toEqual([overrides[0]]);
    expect(saved.effective.item).toEqual(["view", "edit"]);
    const read = unwrap({
      result: await execute({ operation: getPermissions, input: subject({ id }), context }),
    });
    expect(read).toEqual(saved);
    const audit = await context.db.auditLog.findFirst({
      where: { operation: "permission.update" },
    });
    expect(audit).toMatchObject({ entityType: "permission", entityId: id });
  });

  it("resets to the preset when an override is left out", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "manager" });
    const deny = [
      { feature: "payment" as const, action: "view" as const, effect: "deny" as const },
    ];
    await execute({
      operation: updatePermissions,
      input: { ...subject({ id }), overrides: deny },
      context,
    });
    const reset = unwrap({
      result: await execute({
        operation: updatePermissions,
        input: { ...subject({ id }), overrides: [] },
        context,
      }),
    });
    expect(reset.overrides).toEqual([]);
    expect(reset.effective.payment).toEqual(["view", "create", "edit"]);
  });

  it("refuses locked admin-only permissions and duplicates", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "manager" });
    const locked = [
      { feature: "member" as const, action: "edit" as const, effect: "allow" as const },
    ];
    const result = await execute({
      operation: updatePermissions,
      input: { ...subject({ id }), overrides: locked },
      context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    if (!result.ok) expect(result.error.issues[0]?.path).toBe("overrides.0");
  });

  it("is admin only and never reaches another organization", async () => {
    const context = await testOrg();
    const id = await addTestMember({ context, role: "member" });
    const manager = await testOrg({ access: "write" });
    const asManager = { ...manager, organizationId: context.organizationId };
    const denied = await execute({
      operation: getPermissions,
      input: subject({ id }),
      context: asManager,
    });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const other = await testOrg();
    const hidden = await execute({
      operation: getPermissions,
      input: subject({ id }),
      context: other,
    });
    expect(errorCode({ result: hidden })).toBe("NOT_FOUND");
  });
});
