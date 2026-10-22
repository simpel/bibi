import { describe, expect, it } from "vitest";
import {
  archiveItemDemand,
  assignLineAllocation,
  createItemDemand,
  execute,
  listLineAllocations,
  updateItemDemand,
} from "../src/index";
import { lineHoldsReconciliation } from "../src/seed/demo/line-holds-reconcile";
import { runReconciliations } from "../src/seed/demo/reconcile";
import { avSetup, heldRows } from "./allocation-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";

type Setup = Awaited<ReturnType<typeof avSetup>>;

/** The room needs one AV unit for its booking; the unit needs its technician in turn. */
async function roomNeedsAv({ setup }: { setup: Setup }) {
  const { context } = setup;
  const input = {
    itemId: setup.room.id,
    entityTypeId: setup.av.type.id,
    windows: ["BOOKING"] as const,
  };
  return unwrap({ result: await execute({ operation: createItemDemand, input, context }) });
}

const bookRoom = ({ setup }: { setup: Setup }) =>
  createTestLine({
    context: setup.context,
    ticketId: setup.ticket.id,
    entityTypeId: setup.type.id,
    itemId: setup.room.id,
    from: 10,
    to: 12,
  });

const allocationsOf = async ({ setup, lineId }: { setup: Setup; lineId: string }) =>
  unwrap({
    result: await execute({
      operation: listLineAllocations,
      input: { lineId },
      context: setup.context,
    }),
  }).items;

const reconcile = ({ setup }: { setup: Setup }) =>
  runReconciliations({ context: setup.context, checks: [lineHoldsReconciliation] });

describe("chained demands (ADR 0059)", () => {
  it("a room's AV unit brings its technician, for the room line's windows", async () => {
    const setup = await avSetup();
    const demand = await roomNeedsAv({ setup });
    const line = unwrap({ result: await bookRoom({ setup }) });
    const [av, tech] = await allocationsOf({ setup, lineId: line.id });
    expect(av).toMatchObject({ demandId: demand.id, unitId: setup.av.ids[0] });
    expect(tech).toMatchObject({
      demandId: setup.demands[0]?.id,
      parentAllocationId: av?.id,
      unitId: setup.technicians.ids[0],
    });
    // The room has no buffers, so the technician's SETUP and TEARDOWN windows are empty.
    expect((await heldRows({ context: setup.context, lineId: line.id })).sort()).toEqual([
      "HOLD AV 1 HARD 10:00-12:00",
      "HOLD Älvsalen HARD 10:00-12:00",
    ]);
    // Another AV unit: the old unit's technician goes and the new unit's comes.
    const swap = { id: av?.id ?? "", unitId: setup.av.ids[1] ?? "" };
    const { context } = setup;
    unwrap({ result: await execute({ operation: assignLineAllocation, input: swap, context }) });
    const after = await allocationsOf({ setup, lineId: line.id });
    expect(after.map((row) => row.demandId)).toEqual([demand.id, setup.demands[1]?.id]);
    expect(await reconcile({ setup })).toEqual([]);
  });

  it("re-derives lines when a demand changes; an optional demand may stay unfilled", async () => {
    const setup = await avSetup();
    const { context } = setup;
    const demand = await roomNeedsAv({ setup });
    const line = unwrap({ result: await bookRoom({ setup }) });
    const more = { id: demand.id, quantity: 4 };
    const refused = await execute({ operation: updateItemDemand, input: more, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? "" : refused.error.message).toContain("pool Technician");
    const optional = { ...more, required: false };
    unwrap({ result: await execute({ operation: updateItemDemand, input: optional, context }) });
    const rows = await allocationsOf({ setup, lineId: line.id });
    const avRows = rows.filter((row) => row.demandId === demand.id);
    // Each AV unit needs a technician and the pool has two: the chained check leaves the third
    // and fourth optional slots unfilled.
    expect(avRows.map((row) => row.unitId === null)).toEqual([false, false, true, true]);
    expect(rows.filter((row) => row.parentAllocationId).map((row) => row.unitId)).toEqual(
      setup.technicians.ids,
    );
    const removed = { id: demand.id };
    unwrap({ result: await execute({ operation: archiveItemDemand, input: removed, context }) });
    expect(await allocationsOf({ setup, lineId: line.id })).toEqual([]);
    expect(await reconcile({ setup })).toEqual([]);
  });

  it("allocating needs item:read as well as program:write (ADR 0050)", async () => {
    const setup = await avSetup();
    const line = unwrap({
      result: await createTestLine({
        context: setup.context,
        ticketId: setup.ticket.id,
        entityTypeId: setup.type.id,
        itemId: setup.av.ids[0],
        from: 10,
        to: 12,
      }),
    });
    const [allocation] = await allocationsOf({ setup, lineId: line.id });
    const context = {
      ...setup.context,
      permissions: { ...setup.context.permissions, item: [] },
    };
    const input = { id: allocation?.id ?? "", unitId: setup.technicians.ids[1] ?? "" };
    const refused = await execute({ operation: assignLineAllocation, input, context });
    expect(errorCode({ result: refused })).toBe("VALIDATION");
  });
});
