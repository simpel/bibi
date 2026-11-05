import { describe, expect, it } from "vitest";
import { errorCode, unwrap } from "./helpers";
import { bookRoom } from "./preview-helpers";
import { setCell } from "./status-grid-helpers";
import {
  type CreateSetup,
  createSetup,
  createWith,
  linesOf,
  roomLine,
  orderCount,
} from "./order-create-helpers";

/** The entry status (Lead) starts room lines Booked: a hard start state (ADR 0081 decision 8). */
async function hardEntry({ setup }: { setup: CreateSetup }) {
  const { context, room, roomState } = setup;
  const cell = { entityTypeId: room.entityTypeId, stateId: roomState.booked.id };
  unwrap({ result: await setCell({ context, orderStatus: "Lead", ...cell }) });
}

type BookInput = { setup: CreateSetup; from: number; hard: boolean };

/** Another order's two-hour line on the room from `from`, soft or hard. */
const book = ({ setup, from, hard }: BookInput) =>
  bookRoom({ setup: { ...setup, customerId: setup.party.customerId }, from, hard });

type Outcome = { ok: boolean; error?: { issues: readonly { path: string }[] } };

const pathsOf = ({ result }: { result: Outcome }) =>
  result.ok ? [] : (result.error?.issues ?? []).map((issue) => issue.path);

describe("order.create: the re-check inside the transaction (ADR 0081 decision 11)", () => {
  it("refuses a line whose hard start state clashes: CONFLICT naming the blocker", async () => {
    const setup = await createSetup();
    const { order: other } = await book({ setup, from: 10, hard: true });
    await hardEntry({ setup });
    const before = await orderCount({ context: setup.context });
    const lines = [roomLine({ setup, from: 7, to: 8 }), roomLine({ setup, from: 9, to: 11 })];
    const result = await createWith({ setup, input: { lines } });
    expect(errorCode({ result })).toBe("CONFLICT");
    expect(pathsOf({ result })).toEqual(["lines.1"]);
    expect(result.ok ? "" : result.error.issues[0]?.message).toContain(
      `order #${other.reference}`,
    );
    expect(await orderCount({ context: setup.context })).toBe(before);
  });

  it("prebooks a soft line over a hard hold and a soft overlap: both created", async () => {
    const setup = await createSetup();
    const { context, roomState } = setup;
    await book({ setup, from: 10, hard: true });
    await book({ setup, from: 14, hard: false });
    const lines = [roomLine({ setup, from: 9, to: 11 }), roomLine({ setup, from: 14, to: 15 })];
    const order = unwrap({ result: await createWith({ setup, input: { lines } }) });
    const made = await linesOf({ context, orderId: order.id });
    expect(made.map((line) => line.stateId)).toEqual([
      roomState.prebooked.id,
      roomState.prebooked.id,
    ]);
  });

  it("maps the holds trigger's overlap of two hard draft lines to CONFLICT at the line", async () => {
    const setup = await createSetup();
    await hardEntry({ setup });
    const before = await orderCount({ context: setup.context });
    const lines = [roomLine({ setup, from: 9, to: 11 }), roomLine({ setup, from: 10, to: 12 })];
    const result = await createWith({ setup, input: { lines } });
    expect(errorCode({ result })).toBe("CONFLICT");
    expect(pathsOf({ result })).toEqual(["lines.1"]);
    expect(await orderCount({ context: setup.context })).toBe(before);
  });

  it("rolls everything back when a later line is invalid", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const before = await orderCount({ context });
    const lineRows = await context.db.line.count();
    const lines = [
      roomLine({ setup, from: 9, to: 10 }),
      { ...roomLine({ setup, from: 10, to: 11 }), quantity: 2, setupId: "no-such-setup" },
    ];
    const result = await createWith({ setup, input: { lines } });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(pathsOf({ result })).toEqual(["lines.1.setupId"]);
    expect(await orderCount({ context })).toBe(before);
    expect(await context.db.line.count()).toBe(lineRows);
  });

  it("rolls back the order and earlier lines when a later line fails on insert", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const before = await orderCount({ context });
    const lines = [
      roomLine({ setup, from: 9, to: 10 }),
      { ...roomLine({ setup, from: 10, to: 11 }), options: [{ itemId: setup.food.dish.id }] },
    ];
    const result = await createWith({ setup, input: { lines } });
    expect(errorCode({ result })).toBe("VALIDATION");
    expect(pathsOf({ result })).toEqual(["lines.1.options"]);
    expect(await orderCount({ context })).toBe(before);
  });
});
