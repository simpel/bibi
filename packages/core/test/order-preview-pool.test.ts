import { describe, expect, it } from "vitest";
import { createOccupancy, type ExecuteContext, execute } from "../src/index";
import { avSetup } from "./allocation-helpers";
import { unwrap } from "./helpers";
import { hours } from "./occupancy-helpers";
import { runPreview } from "./preview-helpers";

type BlockInput = { context: ExecuteContext; itemId: string };

/** A maintenance block on the unit 08–12 on 1 November 2037 UTC. */
const block = async ({ context, itemId }: BlockInput) =>
  unwrap({
    result: await execute({
      operation: createOccupancy,
      input: { itemId, type: "MAINTENANCE", ...hours({ from: 8, to: 12 }) },
      context,
    }),
  });

describe("order.previewLines: pools (ADR 0059, 0081)", () => {
  it("reports POOL_SHORT when a mandatory demand finds fewer free units than it needs", async () => {
    const setup = await avSetup();
    const { context, order, type, av, technicians, demands } = setup;
    const line = {
      entityTypeId: type.id,
      name: "Projector",
      itemId: av.ids[0],
      ...hours({ from: 9, to: 11 }),
    };
    const input = {
      customerId: order.customerId,
      ...hours({ from: 9, to: 13 }),
      headcount: 4,
      lines: [line],
    };
    const free = unwrap({ result: await runPreview({ context, input }) });
    expect(free.entries[0]?.lines[0]?.issues).toEqual([]);
    await block({ context, itemId: technicians.ids[0] as string });
    const one = unwrap({ result: await runPreview({ context, input }) });
    expect(one.entries[0]?.lines[0]?.issues).toEqual([]);
    await block({ context, itemId: technicians.ids[1] as string });
    const none = unwrap({ result: await runPreview({ context, input }) });
    expect(none.entries[0]?.lines[0]?.issues).toEqual([
      expect.objectContaining({ kind: "POOL_SHORT", demandId: demands[0]?.id, needed: 1, free: 0 }),
    ]);
    expect(none.entries[0]?.group).toBe("AVAILABLE");
  });
});
