import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveEntityType,
  archiveFieldDefinition,
  createContact,
  createCustomer,
  execute,
  getCustomer,
  listCustomers,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

describe("customer archiving and type usage (ADR 0021, 0022)", () => {
  it("lists by type and name, and archiving is refused while contacts are active", async () => {
    const context = testContext();
    const { type } = await createTypeWithField({ context, base: "CUSTOMER", name: "Company" });
    const contactType = await createTypeWithField({ context, base: "CONTACT", name: "Person" });
    const create = ({ name }: { name: string }) =>
      execute({ operation: createCustomer, input: { entityTypeId: type.id, name }, context });
    const kvarnby = unwrap({ result: await create({ name: "Kvarnby Design AB" }) });
    unwrap({ result: await create({ name: "Hisingen Energi AB" }) });
    const found = unwrap({
      result: await execute({ operation: listCustomers, input: { query: "kvarn" }, context }),
    });
    expect(found.items.map((c) => c.name)).toEqual(["Kvarnby Design AB"]);
    unwrap({
      result: await execute({
        operation: createContact,
        input: { customerId: kvarnby.id, entityTypeId: contactType.type.id, name: "Linnea Kvist" },
        context,
      }),
    });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: kvarnby.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
  });

  it("archives a customer without contacts and hides it", async () => {
    const context = testContext();
    const { type } = await createTypeWithField({ context, base: "CUSTOMER", name: "Private" });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Familjen Rask" },
        context,
      }),
    });
    unwrap({
      result: await execute({ operation: archiveCustomer, input: { id: customer.id }, context }),
    });
    const gone = await execute({ operation: getCustomer, input: { id: customer.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
  });

  it("blocks archiving the type or a field while customers use them", async () => {
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
    const typeArchive = await execute({
      operation: archiveEntityType,
      input: { id: type.id },
      context,
    });
    expect(errorCode({ result: typeArchive })).toBe("CONFLICT");
    const fieldArchive = await execute({
      operation: archiveFieldDefinition,
      input: { id: fieldId },
      context,
    });
    expect(errorCode({ result: fieldArchive })).toBe("CONFLICT");
  });
});
