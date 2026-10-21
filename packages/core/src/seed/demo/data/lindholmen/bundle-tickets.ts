import type { DemoTicket } from "../../ticket-types";

/**
 * Lindholmen's ticket with an expanded bundle (ADR 0059, `docs/demo-seed.md`): L15 books the
 * Conference day, a bundle line that carries the price and part lines for Vrångö, the morning
 * break and lunch. Its sent quote charges the bundle line only, with VAT per rate (25 % and 12 %).
 */
export const lindholmenBundleTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "L15", customer: "Hisingen Energi AB", type: "Conference", day: 18, from: "09:00" },
    ...{ to: "17:00", phase: "Quote sent", headcount: 24, assignee: "Johan Ek" },
    ...{ quote: "Conference day", followers: ["Erik Lund"] },
    fields: { Purpose: "Sales conference" },
    bundles: [{ item: "Conference day", from: "09:00", to: "17:00" }],
  },
];
