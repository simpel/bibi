import { describe, expect, it } from "vitest";
import {
  createLine,
  createOccupancy,
  type ExecuteContext,
  execute,
  updateItemState,
  updateSetup,
} from "../src/index";
import { lineHoldsReconciliation } from "../src/seed/demo/line-holds-reconcile";
import { runReconciliations } from "../src/seed/demo/reconcile";
import { errorCode, unwrap } from "./helpers";
import { activeOccupancies, programSetup } from "./line-helpers";
import { hours } from "./occupancy-helpers";

type Setup = Awaited<ReturnType<typeof programSetup>>;

/** A line on the room with its setup: `[from, to)` on 1 November 2026, or in 2020 when `past`. */
async function lineAt({
  setup,
  from,
  to,
  past,
}: {
  setup: Setup;
  from: number;
  to: number;
  past?: boolean;
}) {
  const { context, ticket, type, room } = setup;
  const period = hours({ from, to });
  const shift = past ? Date.UTC(2026, 10, 1) - Date.UTC(2020, 0, 1) : 0;
  const input = {
    ...{ ticketId: ticket.id, entityTypeId: type.id, itemId: room.id, setupId: setup.setup.id },
    name: past ? "Past" : "Future",
    startsAt: new Date(period.startsAt.getTime() - shift),
    endsAt: new Date(period.endsAt.getTime() - shift),
  };
  return unwrap({ result: await execute({ operation: createLine, input, context }) });
}

const rowsOf = async ({ context, lineId }: { context: ExecuteContext; lineId: string }) =>
  (await activeOccupancies({ context, lineId })).map(
    (row) => `${row.type}:${row.holdKind ?? "-"} ${row.startsAt.toISOString().slice(11, 16)}`,
  );

const reconcile = ({ context }: { context: ExecuteContext }) =>
  runReconciliations({ context, checks: [lineHoldsReconciliation] });

describe("line holds are a trigger-written projection (ADR 0053)", () => {
  it("re-derives future setup buffers on a changeover change and refuses an overlap", async () => {
    const setup = await programSetup();
    const { context, room } = setup;
    const past = await lineAt({ setup, from: 10, to: 12, past: true });
    const future = await lineAt({ setup, from: 10, to: 12 });
    expect(await rowsOf({ context, lineId: future.id })).toEqual([
      "SETUP:HARD 09:00",
      "HOLD:HARD 10:00",
    ]);
    const block = { itemId: room.id, type: "MAINTENANCE" as const, ...hours({ from: 7, to: 8 }) };
    unwrap({ result: await execute({ operation: createOccupancy, input: block, context }) });
    const longer = { id: setup.setup.id, changeoverMinutes: 90 };
    unwrap({ result: await execute({ operation: updateSetup, input: longer, context }) });
    expect(await rowsOf({ context, lineId: future.id })).toEqual([
      "SETUP:HARD 08:30",
      "HOLD:HARD 10:00",
    ]);
    // The past is frozen: an ended line keeps its old buffer.
    expect(await rowsOf({ context, lineId: past.id })).toEqual([
      "SETUP:HARD 09:00",
      "HOLD:HARD 10:00",
    ]);
    const clash = { id: setup.setup.id, changeoverMinutes: 150 };
    const refused = await execute({ operation: updateSetup, input: clash, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    expect(refused.ok ? [] : refused.error.issues.map((issue) => issue.path)).toEqual([
      `lines.${future.id}`,
    ]);
    const kept = await context.db.setup.findFirstOrThrow({ where: { id: setup.setup.id } });
    expect(kept.changeoverMinutes).toBe(90);
    expect(await reconcile({ context })).toEqual([]);
  });

  it("re-derives only lines that have not ended when a state's hold changes", async () => {
    const setup = await programSetup();
    const { context } = setup;
    const past = await lineAt({ setup, from: 10, to: 12, past: true });
    const future = await lineAt({ setup, from: 10, to: 12 });
    const stateId = future.stateId ?? "";
    const soft = { id: stateId, hold: "SOFT" as const };
    unwrap({ result: await execute({ operation: updateItemState, input: soft, context }) });
    // A soft hold keeps its buffer, of its own kind (ADR 0059).
    const softRows = ["SETUP:SOFT 09:00", "HOLD:SOFT 10:00"];
    expect(await rowsOf({ context, lineId: future.id })).toEqual(softRows);
    expect(await rowsOf({ context, lineId: past.id })).toEqual([
      "SETUP:HARD 09:00",
      "HOLD:HARD 10:00",
    ]);
    const second = await lineAt({ setup, from: 11, to: 13 });
    const hard = { id: stateId, hold: "HARD" as const };
    const refused = await execute({ operation: updateItemState, input: hard, context });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    // Whichever of the two overlapping lines is derived second collides with the first.
    const paths = refused.ok ? [] : refused.error.issues.map((issue) => issue.path);
    expect(paths).toHaveLength(1);
    expect([`lines.${future.id}`, `lines.${second.id}`]).toContain(paths[0]);
    expect(await rowsOf({ context, lineId: future.id })).toEqual(softRows);
    expect(await reconcile({ context })).toEqual([]);
  });

  it("lets only one of two concurrent bookings of the same slot through", async () => {
    const setup = await programSetup();
    const { context, ticket, type, room } = setup;
    const input = { ticketId: ticket.id, entityTypeId: type.id, itemId: room.id, name: "Race" };
    const attempts = [1, 2].map(() =>
      execute({
        operation: createLine,
        input: { ...input, ...hours({ from: 9, to: 11 }) },
        context,
      }),
    );
    const codes = (await Promise.all(attempts)).map((result) => errorCode({ result })).sort();
    expect(codes).toEqual(["CONFLICT", null]);
    const holds = await context.db.occupancy.count({ where: { itemId: room.id, type: "HOLD" } });
    expect(holds).toBe(1);
    expect(await reconcile({ context })).toEqual([]);
  });
});
