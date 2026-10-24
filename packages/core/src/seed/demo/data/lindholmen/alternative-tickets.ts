import type { DemoTicket } from "../../ticket-types";

const quoted = { quote: "Conference lunch" };

/**
 * Lindholmen's tickets with alternatives (ADR 0052, `docs/demo-seed.md`): L13 is quoted with
 * "Hönö or Styrsö" for its workshop, both soft-held while the customer decides; L14's customer
 * picked Hönö when accepting, so its Styrsö option is released and the grid booked Hönö.
 */
export const lindholmenAlternativeTickets: readonly DemoTicket[] = [
  {
    ...quoted,
    ...{ ref: "L13", customer: "Kvarnby Design AB", type: "Conference", day: 20, from: "09:00" },
    ...{ to: "12:00", status: "Quote sent", headcount: 14, assignee: "Maria Holm" },
    fields: { Purpose: "Design workshop" },
    lines: [
      // ADR 0059: its own setup (30 min) wins over the room type's 15; a soft hold's buffer.
      { item: "Hönö", name: "Workshop in Hönö", from: "09:00", to: "12:00", setupMinutes: 30 },
      { item: "Styrsö", name: "Workshop in Styrsö", from: "09:00", to: "12:00" },
    ],
    alternatives: [{ name: "Workshop room", lines: ["Workshop in Hönö", "Workshop in Styrsö"] }],
  },
  {
    ...quoted,
    ...{ ref: "L14", customer: "Älvstrand Tech AB", type: "Conference", day: 25, from: "09:00" },
    ...{ to: "12:00", status: "Confirmed", headcount: 16, assignee: "Johan Ek" },
    fields: { Purpose: "Planning day" },
    lines: [
      { item: "Hönö", name: "Planning in Hönö", from: "09:00", to: "12:00" },
      { item: "Styrsö", name: "Planning in Styrsö", from: "09:00", to: "12:00" },
    ],
    alternatives: [
      {
        name: "Planning room",
        lines: ["Planning in Hönö", "Planning in Styrsö"],
        chosen: "Planning in Hönö",
      },
    ],
  },
];
