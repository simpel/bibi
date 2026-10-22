import type { ItemStateDto, LineDto, OccupancyDto, TicketDto } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { toCalendarBlocks } from "./calendar-blocks";

const day = new Date("2026-10-15T08:00:00Z");

const occupancy = ({ overrides }: { overrides: Partial<OccupancyDto> }): OccupancyDto => ({
  id: "o1",
  organizationId: "org",
  itemId: "room",
  type: "HOLD",
  holdKind: "HARD",
  startsAt: day,
  endsAt: new Date("2026-10-15T10:00:00Z"),
  lineId: null,
  note: null,
  status: "ACTIVE",
  createdAt: day,
  updatedAt: day,
  createdBy: null,
  ...overrides,
});

const line = { id: "p1", ticketId: "b1", name: "Lunch" } as LineDto;
const ticket = { id: "b1", reference: 12 } as TicketDto;

describe("calendar blocks", () => {
  it("links a line's rows to its ticket", () => {
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { lineId: "p1" } })],
      lines: [line],
      tickets: [ticket],
      states: [],
    });
    expect(block).toMatchObject({ ticketId: "b1", reference: 12, title: "Lunch", soft: false });
  });

  it("shows when a soft hold's line was held (ADR 0044)", () => {
    const heldAt = new Date("2026-10-03T09:00:00Z");
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { holdKind: "SOFT", lineId: "p1" } })],
      lines: [{ ...line, heldAt }],
      tickets: [ticket],
      states: [],
    });
    expect(block).toMatchObject({ soft: true, heldAt });
  });

  it("carries the line's state name and color and the ticket's expiry on a soft hold", () => {
    const holdsUntil = new Date("2026-11-01T00:00:00Z");
    const state = { id: "s1", name: "Prebooked", color: "#22c55e", expires: true } as ItemStateDto;
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { holdKind: "SOFT", lineId: "p1" } })],
      lines: [{ ...line, stateId: "s1" }],
      tickets: [{ ...ticket, phaseId: "ph1", holdsUntil }],
      states: [state],
    });
    expect(block).toMatchObject({
      stateName: "Prebooked",
      stateColor: "#22c55e",
      phaseId: "ph1",
      expiresAt: holdsUntil,
    });
  });

  it("links a line's setup time to its ticket and leaves manual blocks unlinked", () => {
    const blocks = toCalendarBlocks({
      occupancies: [
        occupancy({ overrides: { id: "setup", type: "SETUP", lineId: "p1" } }),
        occupancy({ overrides: { id: "manual", type: "MAINTENANCE", note: "Paint" } }),
      ],
      lines: [line],
      tickets: [ticket],
      states: [],
    });
    expect(blocks.map(({ ticketId, title }) => ({ ticketId, title }))).toEqual([
      { ticketId: "b1", title: "Lunch" },
      { ticketId: null, title: "Paint" },
    ]);
  });

  it("draws a soft hold's teardown soft, labelled by its type rather than held since", () => {
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { type: "TEARDOWN", holdKind: "SOFT", lineId: "p1" } })],
      lines: [{ ...line, heldAt: day }],
      tickets: [ticket],
      states: [],
    });
    expect(block).toMatchObject({ type: "TEARDOWN", soft: true, heldAt: null, expiresAt: null });
  });
});
