import { describe, expect, it } from "vitest";
import { createOrderTemplate, execute } from "../src/index";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { roomAndDish } from "./order-template-helpers";
import { bookRoom, type PreviewSetup, preview, previewSetup } from "./preview-helpers";

/** A package of the room (09–11 from a 09 start) and coffee for 2–12 guests. */
async function rangedPackage({
  setup,
  name = "Small meeting",
}: {
  setup: PreviewSetup;
  name?: string;
}) {
  const input = {
    ...{ name, entityTypeId: setup.orderType.id, statusId: setup.confirmed.id },
    ...{ minGuests: 2, maxGuests: 12, lines: roomAndDish({ setup }) },
  };
  return unwrap({
    result: await execute({ operation: createOrderTemplate, input, context: setup.context }),
  });
}

describe("order.previewLines: package groups (ADR 0081 decision 5)", () => {
  it("puts a package that fits in AVAILABLE, starting in the entry status's states", async () => {
    const setup = await previewSetup();
    const template = await rangedPackage({ setup });
    const result = await preview({ setup, input: { templateIds: [template.id] } });
    const [entry] = result.entries;
    expect(entry).toMatchObject({ templateId: template.id, group: "AVAILABLE", issues: [] });
    expect(entry?.lines.map((line) => line.stateId)).toEqual([
      setup.roomState.prebooked.id,
      setup.food.estimated.id,
    ]);
    expect(entry?.endsAt).toEqual(new Date(Date.UTC(2037, 10, 1, 11)));
  });

  it("puts a package with a hard clash in CLASHES", async () => {
    const setup = await previewSetup();
    const template = await rangedPackage({ setup });
    await bookRoom({ setup, from: 10, hard: true });
    const result = await preview({ setup, input: { templateIds: [template.id] } });
    expect(result.entries[0]?.group).toBe("CLASHES");
  });

  it("puts a package outside the guest range in OUTSIDE_RANGE, even when it also clashes", async () => {
    const setup = await previewSetup();
    const template = await rangedPackage({ setup });
    await bookRoom({ setup, from: 10, hard: true });
    const result = await preview({ setup, input: { headcount: 13, templateIds: [template.id] } });
    const [entry] = result.entries;
    expect(entry?.group).toBe("OUTSIDE_RANGE");
    expect(entry?.issues).toEqual([
      expect.objectContaining({ kind: "GUESTS_OUTSIDE_RANGE", minGuests: 2, maxGuests: 12 }),
    ]);
    expect(entry?.lines[0]?.issues.map((issue) => issue.kind)).toEqual(["HARD_CLASH"]);
  });

  it("puts a package that runs past the requested end in OUTSIDE_RANGE", async () => {
    const setup = await previewSetup();
    const template = await rangedPackage({ setup });
    const input = { ...hours({ from: 9, to: 10 }), templateIds: [template.id] };
    const result = await preview({ setup, input });
    expect(result.entries[0]?.group).toBe("OUTSIDE_RANGE");
    expect(result.entries[0]?.issues).toEqual([
      expect.objectContaining({
        kind: "PAST_REQUESTED_END",
        endsAt: new Date(Date.UTC(2037, 10, 1, 11)),
      }),
    ]);
  });

  it("returns one entry per package in the order asked", async () => {
    const setup = await previewSetup();
    const first = await rangedPackage({ setup });
    const second = await rangedPackage({ setup, name: "Second" });
    const result = await preview({ setup, input: { templateIds: [second.id, first.id] } });
    expect(result.entries.map((entry) => entry.templateId)).toEqual([second.id, first.id]);
  });
});
