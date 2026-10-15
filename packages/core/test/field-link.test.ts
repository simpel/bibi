import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveEntityType,
  createEntityType,
  createFieldDefinition,
  execute,
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
  const link = unwrap({
    result: await execute({
      operation: createFieldDefinition,
      input: {
        entityTypeId: room.id,
        name: "Owner",
        kind: "LINK",
        linkTypeId: customer.entityTypeId,
      },
      context,
    }),
  });
  const item = await createTestItem({ context, entityTypeId: room.id, name: "Vinga" });
  const setValue = ({ value }: { value: unknown }) =>
    execute({ operation: updateItem, input: { id: item.id, fields: { owner: value } }, context });
  return { room, customer, link, item, setValue };
}

describe("LINK fields (ADR 0021, 0026)", () => {
  it("needs a linkable target type of the organization", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const field = ({ input }: { input: Record<string, unknown> }) =>
      execute({
        operation: createFieldDefinition,
        input: { entityTypeId: room.id, name: "Link", kind: "LINK", ...input } as never,
        context,
      });
    expect(errorCode({ result: await field({ input: {} }) })).toBe("VALIDATION");
    expect(errorCode({ result: await field({ input: { linkTypeId: "missing" } }) })).toBe(
      "VALIDATION",
    );
    const foreign = await createTestCustomer({ context: testContext(), name: "Other AB" });
    expect(
      errorCode({ result: await field({ input: { linkTypeId: foreign.entityTypeId } }) }),
    ).toBe("VALIDATION");
    const inquiry = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "INQUIRY", name: "Inquiry" },
        context,
      }),
    });
    expect(errorCode({ result: await field({ input: { linkTypeId: inquiry.id } }) })).toBe(
      "VALIDATION",
    );
    const text = await field({ input: { kind: "TEXT", linkTypeId: room.id } });
    expect(errorCode({ result: text })).toBe("VALIDATION");
  });

  it("accepts a record of the target type and rejects wrong or foreign ids", async () => {
    const context = testContext();
    const { customer, item, setValue } = await setUp({ context });
    const saved = unwrap({ result: await setValue({ value: customer.id }) });
    expect(saved.fields).toEqual({ owner: customer.id });
    const foreign = await createTestCustomer({ context: testContext(), name: "Other AB" });
    for (const value of [foreign.id, item.id, "missing", "not an id!", 42]) {
      const result = await setValue({ value });
      expect(errorCode({ result })).toBe("VALIDATION");
      expect(result.ok ? null : result.error.issues[0]?.path).toBe("fields.owner");
    }
  });

  it("refuses to change the target or archive linked data while values exist", async () => {
    const context = testContext();
    const { room, customer, link, setValue } = await setUp({ context });
    unwrap({ result: await setValue({ value: customer.id }) });
    const other = await createTestCustomer({ context, name: "Other AB" });
    const retarget = await execute({
      operation: updateFieldDefinition,
      input: { id: link.id, linkTypeId: other.entityTypeId },
      context,
    });
    expect(errorCode({ result: retarget })).toBe("CONFLICT");
    const archive = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: archive })).toBe("CONFLICT");
    const empty = unwrap({
      result: await execute({
        operation: createEntityType,
        input: { base: "CONTACT", name: "Host" },
        context,
      }),
    });
    const input = {
      entityTypeId: room.id,
      name: "Host",
      kind: "LINK" as const,
      linkTypeId: empty.id,
    };
    unwrap({ result: await execute({ operation: createFieldDefinition, input, context }) });
    const type = await execute({ operation: archiveEntityType, input: { id: empty.id }, context });
    expect(errorCode({ result: type })).toBe("CONFLICT");
    unwrap({ result: await setValue({ value: null }) });
    unwrap({
      result: await execute({ operation: archiveCustomer, input: { id: customer.id }, context }),
    });
    const archived = await setValue({ value: customer.id });
    expect(errorCode({ result: archived })).toBe("VALIDATION");
  });
});
