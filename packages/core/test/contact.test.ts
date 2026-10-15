import { describe, expect, it } from "vitest";
import {
  archiveContact,
  archiveCustomer,
  createContact,
  execute,
  getContact,
  listContacts,
  updateContact,
} from "../src/index";
import { createTestCustomer, createTypeWithField } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";

describe("contacts (ADR 0022)", () => {
  it("creates contacts at a customer, lists them per customer and updates fields", async () => {
    const context = testContext();
    const nordkust = await createTestCustomer({ context, name: "Nordkust Logistik AB" });
    const hisingen = await createTestCustomer({ context, name: "Hisingen Energi AB" });
    const { type, key } = await createTypeWithField({ context, base: "CONTACT", name: "Person" });
    const add = ({ customerId, name }: { customerId: string; name: string }) =>
      execute({
        operation: createContact,
        input: { customerId, entityTypeId: type.id, name, email: `${name[0]}@example.test` },
        context,
      });
    const karin = unwrap({ result: await add({ customerId: nordkust.id, name: "Karin Wallin" }) });
    unwrap({ result: await add({ customerId: hisingen.id, name: "Mats Olsson" }) });
    const list = unwrap({
      result: await execute({
        operation: listContacts,
        input: { customerId: nordkust.id },
        context,
      }),
    });
    expect(list.items.map((c) => c.name)).toEqual(["Karin Wallin"]);
    const updated = unwrap({
      result: await execute({
        operation: updateContact,
        input: { id: karin.id, phone: "070-1234567", fields: { [key]: "Orderer" } },
        context,
      }),
    });
    expect(updated).toMatchObject({ customerId: nordkust.id, fields: { [key]: "Orderer" } });
  });

  it("refuses an archived or unknown customer and a type of another base", async () => {
    const context = testContext();
    const customer = await createTestCustomer({ context, name: "Göta Advokatbyrå KB" });
    const { type } = await createTypeWithField({ context, base: "CONTACT", name: "Person" });
    const wrongType = await execute({
      operation: createContact,
      input: { customerId: customer.id, entityTypeId: customer.entityTypeId, name: "X" },
      context,
    });
    expect(wrongType.ok ? null : wrongType.error.issues[0]?.path).toBe("entityTypeId");
    unwrap({
      result: await execute({ operation: archiveCustomer, input: { id: customer.id }, context }),
    });
    const archived = await execute({
      operation: createContact,
      input: { customerId: customer.id, entityTypeId: type.id, name: "Henrik Strand" },
      context,
    });
    expect(archived.ok ? null : archived.error.issues[0]?.path).toBe("customerId");
  });

  it("archives a contact, which then frees the customer for archiving", async () => {
    const context = testContext();
    const customer = await createTestCustomer({ context, name: "Älvstrand Tech AB" });
    const { type } = await createTypeWithField({ context, base: "CONTACT", name: "Person" });
    const amir = unwrap({
      result: await execute({
        operation: createContact,
        input: { customerId: customer.id, entityTypeId: type.id, name: "Amir Haddad" },
        context,
      }),
    });
    unwrap({
      result: await execute({ operation: archiveContact, input: { id: amir.id }, context }),
    });
    const gone = await execute({ operation: getContact, input: { id: amir.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
  });

  it("cannot attach a contact to another organization's customer", async () => {
    const owner = testContext();
    const customer = await createTestCustomer({ context: owner, name: "Kvarnby Design AB" });
    const other = testContext();
    const { type } = await createTypeWithField({ context: other, base: "CONTACT", name: "Person" });
    const leak = await execute({
      operation: createContact,
      input: { customerId: customer.id, entityTypeId: type.id, name: "Linnea Kvist" },
      context: other,
    });
    expect(leak.ok ? null : leak.error.issues[0]?.path).toBe("customerId");
  });
});
