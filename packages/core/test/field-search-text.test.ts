import { describe, expect, it } from "vitest";
import { createFieldDefinition, execute, itemEmbeddable, updateItem } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";
import { createRoomType, createTestItem } from "./item-helpers";

async function textOf({ context, id }: { context: ReturnType<typeof testContext>; id: string }) {
  const [entity] = await itemEmbeddable.load({ ids: [id], db: context.db });
  if (!entity) throw new Error("item not loaded");
  return itemEmbeddable.toText({ entity });
}

describe("field values in search text", () => {
  it("writes a boolean as the field name, without Swedish words", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    unwrap({
      result: await execute({
        operation: createFieldDefinition,
        input: { entityTypeId: room.id, name: "Smoking", kind: "BOOLEAN" },
        context,
      }),
    });
    const item = await createTestItem({ context, entityTypeId: room.id, name: "Vinga" });
    const set = ({ value }: { value: boolean }) =>
      execute({
        operation: updateItem,
        input: { id: item.id, fields: { smoking: value } },
        context,
      });
    unwrap({ result: await set({ value: true }) });
    const yes = await textOf({ context, id: item.id });
    expect(yes).toContain("Smoking");
    expect(yes).not.toMatch(/\b(ja|nej)\b/);
    unwrap({ result: await set({ value: false }) });
    expect(await textOf({ context, id: item.id })).not.toContain("Smoking");
  });

  it("keeps a linked record's name out of the text (ADR 0050, feature scope)", async () => {
    const context = testContext();
    const room = await createRoomType({ context });
    const customer = await createTestCustomer({ context, name: "Volvo AB" });
    unwrap({
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
    unwrap({
      result: await execute({
        operation: updateItem,
        input: { id: item.id, fields: { owner: customer.id } },
        context,
      }),
    });
    const text = await textOf({ context, id: item.id });
    expect(text).toContain("Vinga");
    expect(text).not.toContain("Volvo AB");
  });
});
