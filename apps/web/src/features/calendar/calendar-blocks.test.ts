import type { BookingDto, OccupancyDto, ProgramItemDto } from "@okazi/core/schemas";
import { describe, expect, it } from "vitest";
import { toCalendarBlocks } from "./calendar-blocks";

const SOURCES = { booking: "booking", programItem: "programItem" };
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

const programItem = { id: "p1", bookingId: "b1", name: "Lunch" } as ProgramItemDto;
const booking = { id: "b1", reference: 12, seriesId: "s1", occurrenceIndex: 3 } as BookingDto;

describe("calendar blocks", () => {
  it("links a program item's rows to its booking", () => {
    const [block] = toCalendarBlocks({
      occupancies: [occupancy({ overrides: { sourceType: "programItem", sourceId: "p1" } })],
      programItems: [programItem],
      bookings: [booking],
      sources: SOURCES,
    });
    expect(block).toMatchObject({ bookingId: "b1", reference: 12, title: "Lunch", seriesId: "s1" });
  });

  it("links a booking's own rows and leaves manual blocks unlinked", () => {
    const blocks = toCalendarBlocks({
      occupancies: [
        occupancy({ overrides: { id: "own", sourceType: "booking", sourceId: "b1" } }),
        occupancy({ overrides: { id: "manual", type: "MAINTENANCE", note: "Paint" } }),
      ],
      programItems: [],
      bookings: [booking],
      sources: SOURCES,
    });
    expect(blocks.map(({ bookingId, title }) => ({ bookingId, title }))).toEqual([
      { bookingId: "b1", title: null },
      { bookingId: null, title: "Paint" },
    ]);
  });
});
