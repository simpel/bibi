import type { DemoTicket } from "../../ticket-types";

const people = { assignee: "Per Vinga", followers: ["Stina Holm"] };
const coffee = { item: "Coffee on board", name: "Coffee" };

/**
 * Vingaleden's closed tickets for the dashboard (ADR 0079, `docs/demo-seed.md`, Dashboard data):
 * two won (an accepted quote, then Completed) and two lost (no accepted quote). The quote
 * charges the Coffee on board line.
 */
export const vingaledenClosedTickets: readonly DemoTicket[] = [
  {
    title: "Hisingen Energi summer charter",
    ...{ ref: "VW1", customer: "Hisingen Energi AB", type: "Charter", day: -45, won: true },
    ...{ from: "18:00", to: "20:30", status: "Completed", headcount: 40, ...people },
    ...{ quote: coffee.item },
    lines: [{ ...coffee }],
  },
  {
    title: "Rask family island trip",
    ...{ ref: "VW2", customer: "Familjen Rask", type: "Round trip", day: -80, won: true },
    ...{ from: "10:00", to: "11:30", status: "Completed", headcount: 9, ...people },
    ...{ quote: coffee.item },
    lines: [{ ...coffee }],
  },
  {
    title: "Kvarnby staff outing",
    ...{ ref: "VX1", customer: "Kvarnby Design AB", type: "Charter", day: -60 },
    ...{ from: "18:00", to: "20:30", status: "Cancelled", reason: "Budget", headcount: 25 },
    ...{ estimatesKr: [18_000], ...people },
  },
  {
    title: "Hisingen Energi evening charter",
    ...{ ref: "VX2", customer: "Hisingen Energi AB", type: "Charter", day: -100 },
    ...{ from: "17:00", to: "19:30", status: "Called off – weather", reason: "Weather" },
    ...{ headcount: 50, estimatesKr: [42_000], ...people },
  },
];
