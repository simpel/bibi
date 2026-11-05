import { describe, expect, it } from "vitest";
import { createOrder, previewChange } from "../src/index";
import { unwrap } from "./helpers";
import {
  createSetup,
  createWith,
  linesOf,
  roomLine,
  orderCount,
  orderInput,
} from "./order-create-helpers";
import { statusByName } from "./order-status-helpers";

describe("order.create with lines (ADR 0081 decision 9)", () => {
  it("creates the order and its timed and untimed lines in the entry status's states", async () => {
    const setup = await createSetup();
    const { context, room, roomState, food, lineType } = setup;
    const order = unwrap({
      result: await createWith({
        setup,
        input: {
          lines: [
            { ...roomLine({ setup, from: 9, to: 11 }), quantity: 1, setupId: null },
            { entityTypeId: lineType.id, name: "Coffee", itemId: food.dish.id },
            { entityTypeId: lineType.id, name: "Welcome sign", unitPriceMinor: 5_000 },
          ],
        },
      }),
    });
    const lead = await statusByName({ context, name: "Lead" });
    expect(order.statusId).toBe(lead.id);
    const lines = await linesOf({ context, orderId: order.id });
    expect(lines.map((line) => [line.name, line.itemId, line.stateId, line.quantity])).toEqual([
      ["Room 9-11", room.id, roomState.prebooked.id, 1],
      ["Coffee", food.dish.id, food.estimated.id, null],
      ["Welcome sign", null, null, null],
    ]);
    expect(lines[0]?.startsAt?.toISOString()).toBe("2037-11-01T09:00:00.000Z");
    expect([lines[1]?.startsAt, lines[2]?.endsAt]).toEqual([null, null]);
    expect(lines[2]?.unitPriceMinor).toBe(5_000);
  });

  it("keeps the booking note on the order and each line's note on its line", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const order = unwrap({
      result: await createWith({
        setup,
        input: {
          note: "Arrive by the north gate",
          lines: [{ ...roomLine({ setup, from: 9, to: 10 }), note: "Projector needed" }],
        },
      }),
    });
    expect(order.note).toBe("Arrive by the north gate");
    const [line] = await linesOf({ context, orderId: order.id });
    expect(line?.note).toBe("Projector needed");
  });

  it("audits the order and each line as its own entity in one command", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const order = unwrap({
      result: await createWith({ setup, input: { lines: [roomLine({ setup, from: 9, to: 10 })] } }),
    });
    const [line] = await linesOf({ context, orderId: order.id });
    const rows = await context.db.auditLog.findMany({
      where: { entityId: { in: [order.id, line?.id ?? ""] } },
    });
    expect(rows.map((row) => [row.operation, row.entityType]).sort()).toEqual([
      ["order.create", "line"],
      ["order.create", "order"],
    ]);
  });

  it("creates a lead without lines when none are given", async () => {
    const setup = await createSetup();
    const order = unwrap({ result: await createWith({ setup, input: { lines: [] } }) });
    expect(await linesOf({ context: setup.context, orderId: order.id })).toEqual([]);
  });

  it("previews the order and its lines for approval (ADR 0049) and writes nothing", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const before = await orderCount({ context });
    const lines = [{ ...roomLine({ setup, from: 9, to: 10 }), name: "Morning room" }];
    const input = orderInput({ setup, input: { lines, intakeKey: "preview" } });
    const preview = unwrap({
      result: await previewChange({ operation: createOrder, input, context }),
    });
    const created = preview.changes.filter((change) => change.kind === "create");
    expect(created.map((change) => change.entityType)).toEqual(["order", "line"]);
    expect(created[1]?.name).toBe("Morning room");
    expect(await orderCount({ context })).toBe(before);
  });
});
