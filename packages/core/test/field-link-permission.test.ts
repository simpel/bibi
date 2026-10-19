import { describe, expect, it } from "vitest";
import { createFieldDefinition, execute, updateItem } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

describe("LINK fields and read permission (#157)", () => {
  it("needs read on the target base before checking the linked id", async () => {
    const admin = testContext();
    const room = await createRoomType({ context: admin });
    const customer = await createTestCustomer({ context: admin, name: "Volvo AB" });
    unwrap({
      result: await execute({
        operation: createFieldDefinition,
        input: {
          entityTypeId: room.id,
          name: "Owner",
          kind: "LINK",
          linkTypeId: customer.entityTypeId,
        },
        context: admin,
      }),
    });
    const item = await createTestItem({ context: admin, entityTypeId: room.id, name: "Vinga" });
    const setValue = ({ value, context }: { value: unknown; context: typeof admin }) =>
      execute({
        operation: updateItem,
        input: { id: item.id, fields: { owner: value } },
        context,
      });
    const writer = testContext({
      organizationId: admin.organizationId,
      permissions: { item: ["view", "create", "edit", "remove"] },
    });
    for (const value of [customer.id, "missing"]) {
      const result = await setValue({ value, context: writer });
      expect(errorCode({ result })).toBe("VALIDATION");
      expect(result.ok ? null : result.error.issues[0]?.message).toMatch(/No permission/);
    }
    const reader = testContext({
      organizationId: admin.organizationId,
      permissions: { item: ["view", "create", "edit", "remove"], customer: ["view"] },
    });
    expect(
      errorCode({ result: await setValue({ value: customer.id, context: reader }) }),
    ).toBeNull();
  });
});
