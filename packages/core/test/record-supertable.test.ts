import { getDb } from "@okazi/db";
import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveFieldDefinition,
  createCustomer,
  execute,
  updateCustomer,
} from "../src/index";
import { createTypeWithField } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";

describe("record supertable (ADR 0056)", () => {
  it("writes and archives the Record row together with the record", async () => {
    const context = testContext();
    const { type, key } = await createTypeWithField({ context, base: "CUSTOMER", name: "Firm" });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Kvarnby Design AB", fields: { [key]: "556" } },
        context,
      }),
    });
    const created = await getDb().record.findUniqueOrThrow({ where: { id: customer.id } });
    expect(created).toMatchObject({
      base: "CUSTOMER",
      entityTypeId: type.id,
      organizationId: context.organizationId,
      fields: { [key]: "556" },
      status: "ACTIVE",
    });
    const input = { id: customer.id, fields: { [key]: "557" } };
    unwrap({ result: await execute({ operation: updateCustomer, input, context }) });
    const id = { id: customer.id };
    unwrap({ result: await execute({ operation: archiveCustomer, input: id, context }) });
    const after = await getDb().record.findUniqueOrThrow({ where: id });
    expect(after).toMatchObject({ fields: { [key]: "557" }, status: "ARCHIVED" });
  });

  it("lists the blocking records in a CONFLICT", async () => {
    const context = testContext();
    const { type, key, fieldId } = await createTypeWithField({
      context,
      base: "CUSTOMER",
      name: "Firm",
    });
    const customer = unwrap({
      result: await execute({
        operation: createCustomer,
        input: { entityTypeId: type.id, name: "Kvarnby Design AB", fields: { [key]: "1" } },
        context,
      }),
    });
    const input = { id: fieldId };
    const refused = await execute({ operation: archiveFieldDefinition, input, context });
    expect(refused.ok ? null : refused.error.issues).toEqual([
      { path: `records.${customer.id}`, message: `CUSTOMER ${customer.id}` },
    ]);
  });

  it("counts blocking records the caller may not read without naming them", async () => {
    const admin = testContext();
    const { type, key, fieldId } = await createTypeWithField({
      context: admin,
      base: "CUSTOMER",
      name: "Firm",
    });
    const input = { entityTypeId: type.id, name: "Kvarnby Design AB", fields: { [key]: "1" } };
    unwrap({ result: await execute({ operation: createCustomer, input, context: admin }) });
    const configurer = testContext({
      organizationId: admin.organizationId,
      permissions: { configuration: ["read", "write", "admin"] },
    });
    const operation = archiveFieldDefinition;
    const refused = await execute({ operation, input: { id: fieldId }, context: configurer });
    expect(refused.ok ? null : refused.error.issues).toEqual([
      { path: "records", message: "1 more records" },
    ]);
  });

  it("finds records inside the running transaction and never another organization's", async () => {
    const context = testContext();
    const other = testContext();
    const { type, key } = await createTypeWithField({ context, base: "CUSTOMER", name: "Firm" });
    const match = { kind: "has" as const, key };
    const seen = await context.db.$transaction(async (tx) => {
      await tx.record.create({
        data: {
          base: "CUSTOMER",
          entityTypeId: type.id,
          fields: { [key]: "x" },
          organizationId: "",
        },
      });
      return tx.$findRecords({ entityTypeId: type.id, match });
    });
    expect(seen.total).toBe(1);
    const foreign = await other.db.$findRecords({ entityTypeId: type.id, match });
    expect(foreign).toEqual({ total: 0, rows: [] });
  });
});
