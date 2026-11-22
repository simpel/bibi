import { describe, expect, it } from "vitest";
import {
  archiveLine,
  archiveRequirement,
  execute,
  updateLine,
  updateOrder,
  updateRequirement,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";
import { moveToStatus } from "./order-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";

/** An order with a line and a need, moved to the closing status "Lost". */
async function closedOrder() {
  const setup = await requirementSetup();
  const { context, order, type, gluten } = setup;
  const base = { context, orderId: order.id, entityTypeId: type.id };
  const need = unwrap({
    result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 3 }),
  });
  unwrap({
    result: await moveToStatus({ context, orderId: order.id, name: "Lost", reason: "Too late" }),
  });
  return { ...setup, need };
}

describe("a closed order is read-only", () => {
  it("refuses changes to its lines and needs", async () => {
    const { context, order, morning, need, lactose, type } = await closedOrder();
    const lineType = morning.entityTypeId;
    const base = { context, orderId: order.id, entityTypeId: lineType };
    const refused = [
      await createTestLine({ ...base, from: 14, to: 15 }),
      await execute({ operation: updateLine, input: { id: morning.id, name: "X" }, context }),
      await execute({ operation: archiveLine, input: { id: morning.id }, context }),
      await addRequirement({
        ...{ context, orderId: order.id, entityTypeId: type.id },
        vocabularyValueId: lactose,
        quantity: 1,
      }),
      await execute({ operation: updateRequirement, input: { id: need.id, quantity: 4 }, context }),
      await execute({ operation: archiveRequirement, input: { id: need.id }, context }),
    ];
    expect(refused.map((result) => errorCode({ result }))).toEqual(refused.map(() => "CONFLICT"));
    const lines = await context.db.line.count({ where: { orderId: order.id, status: "ACTIVE" } });
    expect(lines).toBe(2);
  });

  it("refuses order details but still takes the buyer reference its invoices need", async () => {
    const { context, order } = await closedOrder();
    const title = await execute({
      operation: updateOrder,
      input: { id: order.id, title: "X" },
      context,
    });
    expect(errorCode({ result: title })).toBe("CONFLICT");
    const reference = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: order.id, buyerReference: "PO-4711" },
        context,
      }),
    });
    expect(reference.buyerReference).toBe("PO-4711");
  });
});
