import { describe, expect, it } from "vitest";
import {
  archiveCustomer,
  archiveItem,
  archiveSetup,
  type ExecuteContext,
  execute,
  saveItemAsBundle,
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
    const { context, order, type, room, setup } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, itemId: room.id };
    const item = unwrap({
      result: await createTestLine({ ...base, from: 10, to: 12, setupId: setup.id }),
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

describe("item.archive and setup.archive with lines", () => {
  it("are refused while an active line uses the item or the setup", async () => {
    const { context, order, type, room, setup } = await programSetup();
    const base = { context, orderId: order.id, entityTypeId: type.id, itemId: room.id };
    unwrap({ result: await createTestLine({ ...base, from: 10, to: 12, setupId: setup.id }) });
    const item = await execute({ operation: archiveItem, input: { id: room.id }, context });
    expect(errorCode({ result: item })).toBe("CONFLICT");
    const archivedSetup = await execute({
      operation: archiveSetup,
      input: { id: setup.id },
      context,
    });
    expect(errorCode({ result: archivedSetup })).toBe("CONFLICT");
  });
});
