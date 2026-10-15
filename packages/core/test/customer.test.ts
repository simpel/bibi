import { describe, expect, it } from "vitest";
import {
  createCustomer,
  createEntityType,
  execute,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

describe("customers (ADR 0022)", () => {
  it("creates a customer with its type's fields and merges fields on update", async () => {
    const context = testContext();
    const { type, key } = await createTypeWithField({ context, base: "CUSTOMER", name: "Company" });
    const created = unwrap({
      result: await execute({
        operation: createCustomer,
        input: {
          entityTypeId: type.id,
          name: "Nordkust Logistik AB",
          invoiceCity: "Göteborg",
          paymentTermsDays: 30,
          fields: { [key]: "556677-8899" },
        },
        context,
      }),
    });
    expect(created).toMatchObject({ invoiceCountry: "SE", fields: { [key]: "556677-8899" } });
    const updated = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: created.id, phone: "031-123456", fields: {} },
        context,
      }),
    });
    expect(updated).toMatchObject({ phone: "031-123456", paymentTermsDays: 30 });
    expect(updated.fields).toEqual({ [key]: "556677-8899" });
    const cleared = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: created.id, fields: { [key]: null } },
        context,
      }),
    });
    expect(cleared.fields).toEqual({});
  });

  it("refuses a type of another base and unknown field keys", async () => {
    const context = testContext();
    const itemType = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "ITEM", name: "Room" },
        context,
      }),
    });
    const wrongBase = await execute({
      operation: createCustomer,
      input: { entityTypeId: itemType.id, name: "X" },
      context,
    });
    expect(wrongBase.ok ? null : wrongBase.error.issues[0]?.path).toBe("entityTypeId");
    const { type } = await createTypeWithField({ context, base: "CUSTOMER", name: "Company" });
    const unknown = await execute({
      operation: createCustomer,
      input: { entityTypeId: type.id, name: "X", fields: { nope: 1 } },
      context,
    });
    expect(unknown.ok ? null : unknown.error.issues[0]?.path).toBe("fields.nope");
  });

  it("never shows another organization's customers", async () => {
    const context = testContext();
    const { type } = await createTypeWithField({ context, base: "CUSTOMER", name: "Company" });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Hisingen Energi AB" },
        context,
      }),
    });
    const other = testContext();
    const get = await execute({
      operation: getCustomer,
      input: { id: customer.id },
      context: other,
    });
    expect(errorCode({ result: get })).toBe("NOT_FOUND");
    const list = unwrap({
      result: await execute({ operation: listCustomers, input: {}, context: other }),
    });
    expect(list.items).toEqual([]);
    const otherType = await execute({
      operation: createCustomer,
      input: { entityTypeId: type.id, name: "Leak" },
      context: other,
    });
    expect(errorCode({ result: otherType })).toBe("VALIDATION");
  });
});
