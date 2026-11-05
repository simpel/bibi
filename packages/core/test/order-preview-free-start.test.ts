import { describe, expect, it } from "vitest";
import { createOccupancy, execute } from "../src/index";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { bookRoom, draftLine, preview, previewSetup } from "./preview-helpers";

describe("order.previewLines: first free start (ADR 0081)", () => {
  it("is the requested start when nothing clashes", async () => {
    const setup = await previewSetup();
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    expect(result.entries[0]?.firstFreeStart).toEqual(new Date(Date.UTC(2037, 10, 1, 9)));
  });

  it("steps 15 minutes at a time to the first start where no line clashes", async () => {
    const setup = await previewSetup();
    await bookRoom({ setup, from: 10, hard: true });
    const lines = [
      draftLine({ setup, from: 9, to: 11 }),
      draftLine({ setup, from: 9, to: 10, itemId: setup.food.dish.id }),
    ];
    const result = await preview({ setup, input: { lines } });
    // The room line moves from 09–11 to 12–14, after the other booking's 10–12.
    expect(result.entries[0]?.firstFreeStart).toEqual(new Date(Date.UTC(2037, 10, 1, 12)));
  });

  it("is null when every start that day clashes, soft holds do not count", async () => {
    const setup = await previewSetup();
    const { context, room } = setup;
    await bookRoom({ setup, from: 8, hard: false });
    // The organization's day (Europe/Stockholm) ends at 23:00 UTC.
    const block = { itemId: room.id, type: "MAINTENANCE" as const, ...hours({ from: 9, to: 23 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    expect(result.entries[0]?.firstFreeStart).toBeNull();
  });
});
