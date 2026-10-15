import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveFieldDefinition,
  archiveItem,
  archiveSetup,
  createCustomer,
  createSetup,
  execute,
  updateFieldDefinition,
  updateItem,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

describe("field usage across bases (ADR 0026)", () => {
  it("blocks changing the kind of a customer field that has values", async () => {
    const context = testContext();
    const { type, key, fieldId } = await createTypeWithField({
      context,
      base: "CUSTOMER",
      name: "Company",
    });
    unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Kvarnby Design AB", fields: { [key]: "1" } },
        context,
      }),
    });
    const change = await execute({
      operation: updateFieldDefinition,
      input: { id: fieldId, kind: "NUMBER" },
      context,
    });
    expect(errorCode({ result: change })).toBe("CONFLICT");
  });

  it("does not count archived rows", async () => {
    const context = testContext();
    const { type, key, fieldId } = await createTypeWithField({
      context,
      base: "CUSTOMER",
      name: "Company",
    });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Kvarnby Design AB", fields: { [key]: "1" } },
        context,
      }),
    });
    unwrap({
      result: await execute({ operation: archiveCustomer, input: { id: customer.id }, context }),
    });
    const archive = await execute({
      operation: archiveFieldDefinition,
      input: { id: fieldId },
      context,
    });
    expect(errorCode({ result: archive })).toBeNull();
  });

  it("refuses to archive a setup while an active item has a capacity for it", async () => {
    const context = testContext();
    const type = await createRoomType({ context });
    const setup = unwrap({
      result: await execute({ operation: createSetup, input: { name: "Theatre" }, context }),
    });
    const item = await createTestItem({ context, entityTypeId: type.id, name: "Vinga" });
    unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: item.id, setups: [{ setupId: setup.id, capacity: 220 }] },
        context,
      }),
    });
    const blocked = await execute({ operation: archiveSetup, input: { id: setup.id }, context });
    expect(errorCode({ result: blocked })).toBe("CONFLICT");
    unwrap({ result: await execute({ operation: archiveItem, input: { id: item.id }, context }) });
    const allowed = await execute({ operation: archiveSetup, input: { id: setup.id }, context });
    expect(errorCode({ result: allowed })).toBeNull();
  });
});
