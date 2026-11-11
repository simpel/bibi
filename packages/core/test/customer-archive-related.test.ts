import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveItem,
  archiveLayout,
  type ExecuteContext,
  execute,
  saveItemAsBundle,
  updateLine,
} from "../src/index";
import { archiveContactsOf } from "./contact-archive-helpers";
import { errorCode, unwrap } from "./helpers";
import { createMealSetup } from "./item-customisation-group-helpers";
import { createTestLine, programSetup } from "./line-helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

type ArchiveInput = {
  context: ExecuteContext;
  id: string;
  archiveOrders?: boolean;
};

const archive = ({ context, ...input }: ArchiveInput) =>
  execute({ operation: archiveCustomer, input, context });

describe("customer.archive with bundles (#151)", () => {
  it("archives the customer's bundles with it, one audit row each", async () => {
    const { context, customer } = await orderSetup();
    const { meal, cod, veal } = await createMealSetup({ context });
    const pkg = unwrap({
      result: await execute({
        operation: saveItemAsBundle,
        input: {
          entityTypeId: meal.id,
          customerId: customer.id,
          name: "Acme lunch",
          parts: [{ itemId: cod }, { itemId: veal }],
        },
        context,
      }),
    });
    unwrap({ result: await archive({ context: context, id: customer.id }) });
    const row = await context.db.item.findFirst({ where: { id: pkg.id, status: "ARCHIVED" } });
    expect(row).not.toBeNull();
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "item", entityId: pkg.id },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("archiving orders releases lines and rooms (#166, #145)", () => {
  it("frees the room after the customer cascade and archives the line", async () => {
    const { context, order, type, room, layout } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await createTestLine({ ...base, from: 10, to: 12, layoutId: layout.id }),
    });
    const other = await createTestOrder({
      context,
      entityTypeId: order.entityTypeId,
      customerId: order.customerId,
    });
    const clash = await createTestLine({ ...base, orderId: other.id, from: 10, to: 12 });
    expect(errorCode({ result: clash })).toBe("CONFLICT");

    await archiveContactsOf({ customerId: order.customerId });
    unwrap({
      result: await archive({ context: context, id: order.customerId, archiveOrders: true }),
    });

    const archived = await context.db.line.findFirst({
      where: { id: item.id, status: "ARCHIVED" },
    });
    expect(archived).not.toBeNull();
    const held = await context.db.occupancy.findMany({
      where: { lineId: item.id },
    });
    expect(held).toHaveLength(0);
    const audit = await context.db.auditLog.findMany({
      where: { operation: "customer.archive", entityType: "line" },
    });
    expect(audit).toHaveLength(1);
  });
});

describe("item.archive and layout.archive with lines", () => {
  it("refuses the item while a line uses it; an archived layout stays on its lines", async () => {
    const { context, order, type, room, layout } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, itemId: room.id };
    const line = unwrap({
      result: await createTestLine({ ...base, from: 10, to: 12, layoutId: layout.id }),
    });
    const item = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: item })).toBe("CONFLICT");
    const input = { id: layout.id };
    unwrap({ result: await execute({ operation: archiveLayout, input, context }) });
    const kept = await execute({
      operation: updateLine,
      input: { id: line.id, name: "Kept" },
      context,
    });
    expect(unwrap({ result: kept }).layoutId).toBe(layout.id);
    const fresh = await createTestLine({ ...base, from: 14, to: 15, layoutId: layout.id });
    expect(errorCode({ result: fresh })).toBe("VALIDATION");
  });
});
