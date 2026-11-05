import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { bookRoom } from "./preview-helpers";
import { setCell } from "./status-grid-helpers";
import { createSetup, createWith, linesOf, roomLine, orderCount } from "./order-create-helpers";

describe("order.create: add-ons under draft lines (ADR 0088)", () => {
  it("writes add-ons as ADD_ON lines under their line, with the line's type and period", async () => {
    const setup = await createSetup();
    const { context, food, room } = setup;
    const order = unwrap({
      result: await createWith({
        setup,
        input: {
          lines: [
            {
              ...roomLine({ setup, from: 9, to: 12 }),
              addOns: [
                { itemId: food.dish.id, quantity: 4, unitPriceMinor: 6_500 },
                { name: "Projector", ...hours({ from: 9, to: 10 }), note: "Morning only" },
              ],
            },
          ],
        },
      }),
    });
    const [parent, dish, projector] = await linesOf({ context, orderId: order.id });
    expect(parent?.itemId).toBe(room.id);
    expect(dish).toMatchObject({
      ...{ role: "ADD_ON", parentLineId: parent?.id, itemId: food.dish.id, name: "Fish stew" },
      ...{ quantity: 4, unitPriceMinor: 6_500, entityTypeId: parent?.entityTypeId },
    });
    expect(dish?.startsAt).toEqual(parent?.startsAt);
    expect(projector).toMatchObject({ role: "ADD_ON", name: "Projector", note: "Morning only" });
    expect(projector?.endsAt?.toISOString()).toBe("2037-11-01T10:00:00.000Z");
  });

  it("refuses a hard clash of a bookable add-on at its path and creates nothing", async () => {
    const setup = await createSetup();
    const { context, room, roomState } = setup;
    await bookRoom({
      setup: { ...setup, customerId: setup.party.customerId },
      from: 9,
      hard: true,
    });
    // The entry status (Lead) starts room lines Booked: a hard start state (ADR 0081).
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.booked.id };
    unwrap({ result: await setCell({ context, orderStatus: "Lead", ...cell }) });
    const before = await orderCount({ context });
    const result = await createWith({
      setup,
      input: {
        lines: [
          {
            entityTypeId: setup.lineType.id,
            name: "Coffee",
            itemId: setup.food.dish.id,
            ...hours({ from: 9, to: 10 }),
            addOns: [{ itemId: setup.room.id, name: "Room" }],
          },
        ],
      },
    });
    expect(errorCode({ result })).toBe("CONFLICT");
    const paths = result.ok ? [] : result.error.issues.map((issue) => issue.path);
    expect(paths).toEqual(["lines.0.addOns.0"]);
    expect(await orderCount({ context })).toBe(before);
  });

  it("refuses an unknown add-on item at its path", async () => {
    const setup = await createSetup();
    const result = await createWith({
      setup,
      input: {
        lines: [{ ...roomLine({ setup, from: 9, to: 10 }), addOns: [{ itemId: "missing" }] }],
      },
    });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(result.ok ? [] : result.error.issues.map((issue) => issue.path)).toEqual([
      "lines.0.addOns.0.itemId",
    ]);
  });
});
