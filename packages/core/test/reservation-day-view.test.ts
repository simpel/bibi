import { describe, expect, it } from "vitest";
import {
  createLayout,
  createReservation,
  execute,
  setDiningServiceException,
  viewReservationDay,
} from "../src/index";
import { PRESET_PERMISSIONS } from "../src/permissions/presets";
import { aheadDate, at, diningRoomReady } from "./dining-helpers";
import { testContext, unwrap } from "./helpers";

describe("the Reservations screen in one read (ADR 0119)", () => {
  it("gives the day's sittings with exceptions, layouts, reservations and blocks", async () => {
    const context = testContext();
    const { item, layout, sitting } = await diningRoomReady({ context });
    const { date, iso } = aheadDate({});
    unwrap({
      result: await execute({
        operation: createReservation,
        input: {
          roomItemId: item.id,
          startsAt: at({ date, hour: 18 }),
          partySize: 3,
          bookerName: "Berg",
        },
        context,
      }),
    });
    const other = unwrap({
      result: await execute({
        operation: createLayout,
        input: { itemId: item.id, name: "Party" },
        context,
      }),
    });
    unwrap({
      result: await execute({
        operation: setDiningServiceException,
        input: { serviceId: sitting.id, date: iso, layoutId: other.id, maxCoversPerSlot: 4 },
        context,
      }),
    });
    const view = unwrap({
      result: await execute({ operation: viewReservationDay, input: { date: iso }, context }),
    });
    expect(view.rooms).toMatchObject([{ itemId: item.id, name: "Kajen", slug: "kajen" }]);
    expect(view.sittings).toMatchObject([
      { id: sitting.id, layoutId: other.id, maxCoversPerSlot: 4, closed: false },
    ]);
    expect(view.layouts.map((one) => one.id)).toEqual([other.id]);
    expect(view.reservations.totals).toMatchObject({ reservations: 1, covers: 3 });
    expect(view.needOptions).toEqual([]);
    expect(layout.id).not.toBe(other.id);
  });

  it("hides item names and layouts without item:read", async () => {
    const context = testContext();
    const { item } = await diningRoomReady({ context });
    const { item: _hidden, ...permissions } = PRESET_PERMISSIONS.member;
    const reader = testContext({ organizationId: context.organizationId, permissions });
    const view = unwrap({
      result: await execute({
        operation: viewReservationDay,
        input: { date: aheadDate({}).iso },
        context: reader,
      }),
    });
    expect(view.rooms).toMatchObject([{ itemId: item.id, name: null }]);
    expect(view.layouts).toEqual([]);
  });
});
