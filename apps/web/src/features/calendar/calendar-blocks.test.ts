import type { OccupancyDto, ProgramItemDto, TicketDto } from "@okazi/core/schemas";
import { describe, expect, it } from "vitest";
import { toCalendarBlocks } from "./calendar-blocks";

const SOURCES = { ticket: "ticket", programItem: "programItem" };
const day = new Date("2026-10-15T08:00:00Z");

const occupancy = ({ overrides }: { overrides: Partial<OccupancyDto> }): OccupancyDto => ({
  id: "o1",
  organizationId: "org",
  itemId: "room",
  type: "BOOKING",
  startsAt: day,
  endsAt: new Date("2026-10-15T10:00:00Z"),
  sourceType: null,
  sourceId: null,
  note: null,
  status: "ACTIVE",
  createdAt: day,
  updatedAt: day,
  createdBy: null,
  ...overrides,
});

const programItem = { id: "p1", ticketId: "b1", name: "Lunch" } as ProgramItemDto;
const ticket = { id: "b1", reference: 12 } as TicketDto;

describe("calendar blocks", () => {
  it("links a program item's rows to its ticket", () => {
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { sourceType: "programItem", sourceId: "p1" } })],
      programItems: [programItem],
      tickets: [ticket],
      sources: SOURCES,
    });
    expect(block).toMatchObject({ ticketId: "b1", reference: 12, title: "Lunch" });
  });

  it("links a ticket's own rows and leaves manual blocks unlinked", () => {
    const blocks = toCalendarBlocks({
      occupancies: [
        occupancy({ overrides: { id: "own", sourceType: "ticket", sourceId: "b1" } }),
        occupancy({ overrides: { id: "manual", type: "MAINTENANCE", note: "Paint" } }),
      ],
      programItems: [],
      tickets: [ticket],
      sources: SOURCES,
    });
    expect(blocks.map(({ ticketId, title }) => ({ ticketId, title }))).toEqual([
      { ticketId: "b1", title: null },
      { ticketId: null, title: "Paint" },
    ]);
  });
});
