import type { CalendarBlockDto } from "@bibi/core/schemas";
import type { CalendarState } from "@bibi/ui";
import { describe, expect, it } from "vitest";
import { toAssetBookings } from "./to-asset-bookings";

const BLOCKED: CalendarState = {
  name: "Blocked",
  color: "var(--input)",
  ink: "var(--foreground)",
  hold: "hard",
};
const UNNAMED: CalendarState = { ...BLOCKED, name: "Booked", color: "var(--primary)" };

const block = ({ over = {} }: { over?: Partial<CalendarBlockDto> }): CalendarBlockDto => ({
  id: "o1",
  itemId: "room",
  type: "HOLD",
  startsAt: new Date("2026-11-01T09:00:00Z"),
  endsAt: new Date("2026-11-01T11:00:00Z"),
  lineId: "l1",
  ticketId: "t1",
  reference: 12,
  title: "Lunch",
  soft: false,
  allocated: false,
  heldAt: null,
  stateId: "s1",
  stateName: "Booked",
  stateColor: "#16a34a",
  statusId: "st1",
  expiresAt: null,
  details: null,
  ...over,
});

const map = ({ blocks }: { blocks: CalendarBlockDto[] }) =>
  toAssetBookings({
    blocks,
    timeZone: "Europe/Stockholm",
    blocked: BLOCKED,
    unnamed: UNNAMED,
    via: { LINE: "Line assignee", TICKET: "Ticket assignee" },
    ticketHref: ({ ticketId }) => `/tickets/${ticketId}`,
  });

const SETUP = {
  id: "o2",
  type: "SETUP" as const,
  startsAt: new Date("2026-11-01T08:30:00Z"),
  endsAt: new Date("2026-11-01T09:00:00Z"),
};

describe("toAssetBookings", () => {
  it("places a hold in the zone with its buffers folded in", () => {
    const [booking, ...rest] = map({ blocks: [block({ over: SETUP }), block({})] });
    expect(rest).toEqual([]);
    expect(booking).toMatchObject({
      date: "2026-11-01",
      start: "10:00",
      end: "12:00",
      setupMinutes: 30,
      teardownMinutes: 0,
      name: "Lunch",
      ticket: "#12",
      href: "/tickets/t1",
      state: { name: "Booked", color: "#16a34a", hold: "hard" },
    });
  });

  it("cuts a line over midnight into both days", () => {
    const over = {
      startsAt: new Date("2026-11-01T21:00:00Z"),
      endsAt: new Date("2026-11-02T01:00:00Z"),
    };
    const days = map({ blocks: [block({ over })] }).map(({ date, start, end }) => [
      date,
      start,
      end,
    ]);
    expect(days).toEqual([
      ["2026-11-01", "22:00", "24:00"],
      ["2026-11-02", "00:00", "02:00"],
    ]);
  });

  it("draws a manual block grey and unsold", () => {
    const over = { type: "MAINTENANCE" as const, lineId: null, ticketId: null, reference: null };
    expect(map({ blocks: [block({ over })] })[0]).toMatchObject({ ticket: null, state: BLOCKED });
  });

  it("carries the details the caller may see, and leaves hidden ones off", () => {
    const details = {
      customer: "Volvo Cars",
      client: { name: "Kim Ek", phone: null, email: "kim@example.com" },
      headcount: 40,
      quantity: 40,
      valueMinor: 1_080_000,
      currency: "SEK",
      note: null,
      contact: {
        ...{ userId: "u1", name: "Anna Berg", email: null, phone: "+46 31 123" },
        ...{ avatarKey: null, via: "TICKET" as const },
      },
      staff: [
        { itemId: "i1", name: "Sam", type: "Host", person: true },
        { itemId: "i2", name: "Projector", type: "AV", person: false },
      ],
    };
    const [booking] = map({ blocks: [block({ over: { details } })] });
    expect(booking).toMatchObject({
      customer: "Volvo Cars",
      client: { name: "Kim Ek", email: "kim@example.com" },
      headcount: 40,
      value: { amount: 10_800, currency: "SEK" },
      contact: { person: { name: "Anna Berg" }, via: "Ticket assignee", inherited: true },
      staff: [{ id: "i1", name: "Sam", role: "Host" }],
    });
    expect(booking).not.toHaveProperty("notes");
  });
});
