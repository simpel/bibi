import { describe, expect, it } from "vitest";
import { createTicket, previewChange } from "../src/index";
import { unwrap } from "./helpers";
import {
  createSetup,
  createWith,
  linesOf,
  roomLine,
  ticketCount,
  ticketInput,
} from "./ticket-create-helpers";
import { statusByName } from "./ticket-status-helpers";

describe("ticket.create with lines (ADR 0081 decision 9)", () => {
  it("creates the ticket and its timed and untimed lines in the entry status's states", async () => {
    const setup = await createSetup();
    const { context, room, roomState, food, lineType } = setup;
    const ticket = unwrap({
      result: await createWith({
        setup,
        input: {
          lines: [
            { ...roomLine({ setup, from: 9, to: 11 }), quantity: 1, setupId: null },
            { entityTypeId: lineType.id, name: "Coffee", itemId: food.dish.id },
            { entityTypeId: lineType.id, name: "Welcome sign", unitPriceMinor: 5_000 },
          ],
        },
      }),
    });
    const lead = await statusByName({ context, name: "Lead" });
    expect(ticket.statusId).toBe(lead.id);
    const lines = await linesOf({ context, ticketId: ticket.id });
    expect(lines.map((line) => [line.name, line.itemId, line.stateId, line.quantity])).toEqual([
      ["Room 9-11", room.id, roomState.prebooked.id, 1],
      ["Coffee", food.dish.id, food.estimated.id, null],
      ["Welcome sign", null, null, null],
    ]);
    expect(lines[0]?.startsAt?.toISOString()).toBe("2037-11-01T09:00:00.000Z");
    expect([lines[1]?.startsAt, lines[2]?.endsAt]).toEqual([null, null]);
    expect(lines[2]?.unitPriceMinor).toBe(5_000);
  });

  it("keeps the booking note on the ticket and each line's note on its line", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const ticket = unwrap({
      result: await createWith({
        setup,
        input: {
          note: "Arrive by the north gate",
          lines: [{ ...roomLine({ setup, from: 9, to: 10 }), note: "Projector needed" }],
        },
      }),
    });
    expect(ticket.note).toBe("Arrive by the north gate");
    const [line] = await linesOf({ context, ticketId: ticket.id });
    expect(line?.note).toBe("Projector needed");
  });

  it("audits the ticket and each line as its own entity in one command", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const ticket = unwrap({
      result: await createWith({ setup, input: { lines: [roomLine({ setup, from: 9, to: 10 })] } }),
    });
    const [line] = await linesOf({ context, ticketId: ticket.id });
    const rows = await context.db.auditLog.findMany({
      where: { entityId: { in: [ticket.id, line?.id ?? ""] } },
    });
    expect(rows.map((row) => [row.operation, row.entityType]).sort()).toEqual([
      ["ticket.create", "line"],
      ["ticket.create", "ticket"],
    ]);
  });

  it("creates a lead without lines when none are given", async () => {
    const setup = await createSetup();
    const ticket = unwrap({ result: await createWith({ setup, input: { lines: [] } }) });
    expect(await linesOf({ context: setup.context, ticketId: ticket.id })).toEqual([]);
  });

  it("previews the ticket and its lines for approval (ADR 0049) and writes nothing", async () => {
    const setup = await createSetup();
    const { context } = setup;
    const before = await ticketCount({ context });
    const lines = [{ ...roomLine({ setup, from: 9, to: 10 }), name: "Morning room" }];
    const input = ticketInput({ setup, input: { lines, intakeKey: "preview" } });
    const preview = unwrap({
      result: await previewChange({ operation: createTicket, input, context }),
    });
    const created = preview.changes.filter((change) => change.kind === "create");
    expect(created.map((change) => change.entityType)).toEqual(["ticket", "line"]);
    expect(created[1]?.name).toBe("Morning room");
    expect(await ticketCount({ context })).toBe(before);
  });
});
