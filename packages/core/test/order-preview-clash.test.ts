import { describe, expect, it } from "vitest";
import { unwrap } from "./helpers";
import { bookRoom, draftLine, preview, previewSetup } from "./preview-helpers";
import { setCell } from "./status-grid-helpers";

describe("order.previewLines: clashes with other bookings (ADR 0081)", () => {
  it("reports a hard hold as HARD_CLASH with its order and period, prebooked by default", async () => {
    const setup = await previewSetup();
    const { order } = await bookRoom({ setup, from: 10, hard: true });
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    const [line] = result.entries[0]?.lines ?? [];
    expect(line?.stateId).toBe(setup.roomState.prebooked.id);
    expect(line?.issues).toEqual([
      expect.objectContaining({
        kind: "HARD_CLASH",
        orderReference: order.reference,
        startsAt: new Date(Date.UTC(2037, 10, 1, 10)),
        endsAt: new Date(Date.UTC(2037, 10, 1, 12)),
        refusesCreate: false,
      }),
    ]);
  });

  it("says Create would refuse the clash when the entry status starts the line hard", async () => {
    const setup = await previewSetup();
    await bookRoom({ setup, from: 10, hard: true });
    const { context, room, roomState } = setup;
    const cell = { entityTypeId: room.entityTypeId, stateId: roomState.booked.id };
    unwrap({ result: await setCell({ context, orderStatus: "Lead", ...cell }) });
    const result = await preview({
      setup,
      input: { lines: [draftLine({ setup, from: 9, to: 11 })] },
    });
    const [line] = result.entries[0]?.lines ?? [];
    expect(line?.stateId).toBe(roomState.booked.id);
    expect(line?.issues.map((issue) => [issue.kind, issue.refusesCreate])).toEqual([
      ["HARD_CLASH", true],
    ]);
  });

  it("reports a soft hold as SOFT_OVERLAP, and nothing when the times only touch", async () => {
    const setup = await previewSetup();
    const { order } = await bookRoom({ setup, from: 10, hard: false });
    const lines = [draftLine({ setup, from: 11, to: 12 }), draftLine({ setup, from: 12, to: 13 })];
    const result = await preview({ setup, input: { lines } });
    const [overlapping, touching] = result.entries[0]?.lines ?? [];
    expect(overlapping?.issues).toEqual([
      expect.objectContaining({ kind: "SOFT_OVERLAP", orderReference: order.reference }),
    ]);
    expect(touching?.issues.filter((issue) => issue.kind === "SOFT_OVERLAP")).toEqual([]);
    expect(result.entries[0]?.group).toBe("AVAILABLE");
  });
});
