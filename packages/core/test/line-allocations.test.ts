import { describe, expect, it } from "vitest";
import {
  archiveLine,
  assignLineAllocation,
  execute,
  listLineAllocations,
  updateItemState,
} from "../src/index";
import { lineHoldsReconciliation } from "../src/seed/demo/line-holds-reconcile";
import { runReconciliations } from "../src/seed/demo/reconcile";
import { avSetup, heldRows } from "./allocation-helpers";
import { errorCode, unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";

type Setup = Awaited<ReturnType<typeof avSetup>>;

const bookAv = ({ setup, unit }: { setup: Setup; unit: number }) =>
  createTestLine({
    context: setup.context,
    ticketId: setup.ticket.id,
    entityTypeId: setup.type.id,
    itemId: setup.av.ids[unit],
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

describe("line allocations (ADR 0059)", () => {
  it("adding AV holds the unit and a technician for its setup and teardown", async () => {
    const setup = await avSetup();
    const line = unwrap({ result: await bookAv({ setup, unit: 0 }) });
    expect((await heldRows({ context: setup.context, lineId: line.id })).sort()).toEqual([
      "HOLD AV 1 HARD 10:00-12:00",
      "SETUP AV 1 HARD 09:45-10:00",
      "SETUP Tech A HARD 09:45-10:00",
      "TEARDOWN AV 1 HARD 12:00-12:15",
      "TEARDOWN Tech A HARD 12:00-12:15",
    ]);
    const [allocation] = await allocationsOf({ setup, lineId: line.id });
    expect(allocation).toMatchObject({
      demandId: setup.demands[0]?.id,
      unitId: setup.technicians.ids[0],
      parentAllocationId: null,
      slot: 0,
    });
    expect(await reconcile({ setup })).toEqual([]);
  });

  it("two overlapping setups cannot share one technician", async () => {
    const setup = await avSetup();
    const first = unwrap({ result: await bookAv({ setup, unit: 0 }) });
    const second = unwrap({ result: await bookAv({ setup, unit: 1 }) });
    const [allocation] = await allocationsOf({ setup, lineId: second.id });
    expect(allocation?.unitId).toBe(setup.technicians.ids[1]);
    const third = await bookAv({ setup, unit: 2 });
    expect(errorCode({ result: third })).toBe("CONFLICT");
    expect(third.ok ? "" : third.error.message).toMatch(/pool Technician for SETUP .*TEARDOWN/);
    const shared = { id: allocation?.id ?? "", unitId: setup.technicians.ids[0] ?? "" };
    const refused = await execute({
      operation: assignLineAllocation,
      input: shared,
      context: setup.context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(await heldRows({ context: setup.context, lineId: first.id })).toContain(
      "SETUP Tech A HARD 09:45-10:00",
    );
    expect(await reconcile({ setup })).toEqual([]);
  });

  it("soft holds may share a technician; a mandatory demand cannot be emptied", async () => {
    const setup = await avSetup();
    const first = unwrap({ result: await bookAv({ setup, unit: 0 }) });
    const soft = { id: first.stateId ?? "", hold: "SOFT" as const };
    const { context } = setup;
    unwrap({ result: await execute({ operation: updateItemState, input: soft, context }) });
    const second = unwrap({ result: await bookAv({ setup, unit: 1 }) });
    const [allocation] = await allocationsOf({ setup, lineId: second.id });
    expect(allocation?.unitId).toBe(setup.technicians.ids[0]);
    expect(await heldRows({ context, lineId: second.id })).toContain(
      "SETUP Tech A SOFT 09:45-10:00",
    );
    const empty = { id: allocation?.id ?? "", unitId: null };
    const refused = await execute({ operation: assignLineAllocation, input: empty, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const other = { id: allocation?.id ?? "", unitId: setup.technicians.ids[1] ?? "" };
    unwrap({ result: await execute({ operation: assignLineAllocation, input: other, context }) });
    expect(await heldRows({ context, lineId: second.id })).toContain(
      "TEARDOWN Tech B SOFT 12:00-12:15",
    );
    expect(await reconcile({ setup })).toEqual([]);
  });

  it("removing the line releases its allocations and their holds", async () => {
    const setup = await avSetup();
    const { context } = setup;
    const line = unwrap({ result: await bookAv({ setup, unit: 0 }) });
    unwrap({ result: await execute({ operation: archiveLine, input: { id: line.id }, context }) });
    expect(await heldRows({ context, lineId: line.id })).toEqual([]);
    const archived = await context.db.lineAllocation.findMany({
      where: { lineId: line.id, status: "ARCHIVED" },
    });
    expect(archived).toHaveLength(1);
    expect(await reconcile({ setup })).toEqual([]);
  });
});
