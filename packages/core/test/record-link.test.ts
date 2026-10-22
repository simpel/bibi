import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveFieldDefinition,
  createCustomer,
  createFieldDefinition,
  execute,
  getItem,
  updateFieldDefinition,
  updateItem,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

type Context = ReturnType<typeof testContext>;

async function setUp({ context }: { context: Context }) {
  const room = await createRoomType({ context });
  const customer = await createTestCustomer({ context, name: "Volvo AB" });
  const input = {
    entityTypeId: room.id,
    name: "Owner",
    kind: "LINK" as const,
    linkTypeId: customer.entityTypeId,
  };
  const link = unwrap({
    result: await execute({ operation: createFieldDefinition, input, context }),
  });
  const item = await createTestItem({ context, entityTypeId: room.id, name: "Vinga" });
  const setValue = ({ value }: { value: unknown }) =>
    execute({ operation: updateItem, input: { id: item.id, fields: { owner: value } }, context });
  return { customer, link, item, setValue };
}

const storedFields = async ({ id }: { id: string }) => ({
  record: (await getDb().record.findUniqueOrThrow({ where: { id } })).fields,
  item: (await getDb().item.findUniqueOrThrow({ where: { id } })).fields,
  links: await getDb().recordLink.findMany({ where: { recordId: id } }),
});

describe("RecordLink (ADR 0056)", () => {
  it("stores a LINK value as a row, never in fields JSON, and merges it on read", async () => {
    const context = testContext();
    const { customer, link, item, setValue } = await setUp({ context });
    const saved = unwrap({ result: await setValue({ value: customer.id }) });
    expect(saved.fields).toEqual({ owner: customer.id });
    const stored = await storedFields({ id: item.id });
    expect(stored.record).toEqual({});
    expect(stored.item).toEqual({});
    expect(stored.links).toMatchObject([
      { fieldId: link.id, targetRecordId: customer.id, organizationId: context.organizationId },
    ]);
    const read = unwrap({
      result: await execute({ operation: getItem, input: { id: item.id }, context }),
    });
    expect(read.fields).toEqual({ owner: customer.id });
    const second = { entityTypeId: customer.entityTypeId, name: "Other AB" };
    const other = unwrap({
      result: await execute({ operation: createCustomer, input: second, context }),
    });
    unwrap({ result: await setValue({ value: other.id }) });
    expect((await storedFields({ id: item.id })).links).toMatchObject([
      { targetRecordId: other.id },
    ]);
    const cleared = unwrap({ result: await setValue({ value: null }) });
    expect(cleared.fields).toEqual({});
    expect((await storedFields({ id: item.id })).links).toEqual([]);
  });

  it("refuses to archive the field or make it required by the link rows", async () => {
    const context = testContext();
    const { customer, link, item, setValue } = await setUp({ context });
    const required = { id: link.id, required: true };
    const lacking = await execute({ operation: updateFieldDefinition, input: required, context });
    expect(lacking.ok ? null : lacking.error.issues).toEqual([
      { path: `records.${item.id}`, message: `ITEM ${item.id}` },
    ]);
    unwrap({ result: await setValue({ value: customer.id }) });
    unwrap({
      result: await execute({ operation: updateFieldDefinition, input: required, context }),
    });
    const input = { id: link.id };
    const archive = await execute({ operation: archiveFieldDefinition, input, context });
    expect(archive.ok ? null : archive.error.issues).toEqual([
      { path: `records.${item.id}`, message: `ITEM ${item.id}` },
    ]);
  });

  it("refuses a link row to another organization's record in the database", async () => {
    const context = testContext();
    const { link, item } = await setUp({ context });
    const foreign = await createTestCustomer({ context: testContext(), name: "Other AB" });
    const insert = getDb().recordLink.create({
      data: {
        organizationId: context.organizationId,
        recordId: item.id,
        fieldId: link.id,
        targetRecordId: foreign.id,
      },
    });
    await expect(insert).rejects.toThrow();
  });

  it("names the linking records when a linked record is archived", async () => {
    const context = testContext();
    const { customer, item, setValue } = await setUp({ context });
    unwrap({ result: await setValue({ value: customer.id }) });
    const input = { id: customer.id };
    const refused = await execute({ operation: archiveCustomer, input, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? null : refused.error.issues).toEqual([
      { path: `records.${item.id}`, message: `ITEM ${item.id}` },
    ]);
  });
});
