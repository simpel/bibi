import { describe, expect, it } from "vitest";
import {
  archiveResponsibility,
  createEntityType,
  createResponsibility,
  execute,
  getResponsibility,
  listResponsibilities,
  updateResponsibility,
} from "../src/index";
import { errorCode, peer, unwrap } from "./helpers";
import { addTestMemberWithUser, testOrg } from "./org-helpers";

async function setup() {
  const context = await testOrg();
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Food & drink" },
      context,
    }),
  });
  const chef = await addTestMemberWithUser({ context, role: "member", name: "Chef" });
  const helper = await addTestMemberWithUser({ context, role: "viewer", name: "Helper" });
  return { context, type, chef: chef.userId, helper: helper.userId };
}

describe("responsibilities (ADR 0034)", () => {
  it("defines Head of kitchen that readers can list and get", async () => {
    const { context, type, chef, helper } = await setup();
    const input = {
      name: "Head of kitchen",
      entityTypeIds: [type.id, type.id],
      defaultAssigneeId: chef,
      defaultFollowerIds: [helper, chef],
    };
    const created = unwrap({
      result: await execute({ operation: createResponsibility, input, context }),
    });
    expect(created).toMatchObject({
      name: "Head of kitchen",
      entityTypeIds: [type.id],
      defaultAssigneeId: chef,
      defaultFollowerIds: [helper],
      status: "ACTIVE",
    });
    const reader = peer({ of: context, access: "read" });
    const listed = unwrap({
      result: await execute({ operation: listResponsibilities, input: {}, context: reader }),
    });
    expect(listed.items.map((item) => item.name)).toEqual(["Head of kitchen"]);
    const got = await execute({
      operation: getResponsibility,
      input: { id: created.id },
      context: reader,
    });
    expect(unwrap({ result: got }).id).toBe(created.id);
    const denied = await execute({ operation: createResponsibility, input, context: reader });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
  });

  it("refuses duplicate names, non-item types and non-members", async () => {
    const { context, type, chef } = await setup();
    const input = { name: "Sales", entityTypeIds: [type.id], defaultAssigneeId: chef };
    unwrap({ result: await execute({ operation: createResponsibility, input, context }) });
    const twice = await execute({ operation: createResponsibility, input, context });
    expect(errorCode({ result: twice })).toBe("CONFLICT");
    const customer = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "CUSTOMER", name: "Company" },
        context,
      }),
    });
    const bad = await execute({
      operation: createResponsibility,
      input: {
        name: "Coordinator",
        entityTypeIds: [customer.id],
        defaultAssigneeId: "user_nobody",
        defaultFollowerIds: ["user_ghost"],
      },
      context,
    });
    expect(errorCode({ result: bad })).toBe("VALIDATION");
    expect(bad.ok ? [] : bad.error.issues.map((issue) => issue.path)).toEqual([
      "entityTypeIds",
      "defaultAssigneeId",
      "defaultFollowerIds",
    ]);
  });

  it("does not accept members or types of another organization", async () => {
    const mine = await setup();
    const theirs = await setup();
    const input = {
      name: "Head of kitchen",
      entityTypeIds: [theirs.type.id],
      defaultAssigneeId: theirs.chef,
    };
    const result = await execute({
      operation: createResponsibility,
      input,
      context: mine.context,
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    const own = unwrap({
      result: await execute({
        operation: createResponsibility,
        input: { ...input, entityTypeIds: [mine.type.id], defaultAssigneeId: mine.chef },
        context: mine.context,
      }),
    });
    const other = await execute({
      operation: getResponsibility,
      input: { id: own.id },
      context: theirs.context,
    });
    expect(errorCode({ result: other })).toBe("NOT_FOUND");
  });

  it("updates, validates the result and archives so the name can be reused", async () => {
    const { context, type, chef, helper } = await setup();
    const input = { name: "Head of kitchen", entityTypeIds: [type.id], defaultAssigneeId: chef };
    const row = unwrap({
      result: await execute({ operation: createResponsibility, input, context }),
    });
    const updated = unwrap({
      result: await execute({
        operation: updateResponsibility,
        input: { id: row.id, defaultAssigneeId: helper, name: "Head chef" },
        context,
      }),
    });
    expect(updated).toMatchObject({ name: "Head chef", defaultAssigneeId: helper });
    expect(updated.entityTypeIds).toEqual([type.id]);
    const bad = await execute({
      operation: updateResponsibility,
      input: { id: row.id, entityTypeIds: ["nope"] },
      context,
    });
    expect(errorCode({ result: bad })).toBe("VALIDATION");
    unwrap({
      result: await execute({ operation: archiveResponsibility, input: { id: row.id }, context }),
    });
    const again = await execute({ operation: createResponsibility, input, context });
    expect(again.ok).toBe(true);
  });
});
