import type { DemoOrder } from "../../order-types";

const people = { assignee: "Per Vinga", followers: ["Stina Holm"] };
const coffee = { item: "Coffee on board", name: "Coffee" };

/**
 * Vingaleden's closed orders for the dashboard (ADR 0079, `docs/demo-seed.md`, Dashboard data):
 * three won (an accepted quote, then Completed; VW1 and VW2 are invoiced, ADR 0100) and two lost (no accepted quote). The quote
 * charges the Coffee on board line.
 */
export const vingaledenClosedOrders: readonly DemoOrder[] = [
  {
    title: "Hisingen Energi summer charter",
    ...{ ref: "VW1", customer: "Hisingen Energi AB", type: "Charter", day: -45, won: true },
    ...{ from: "18:00", to: "20:30", status: "Completed", headcount: 40, ...people },
    ...{ quote: coffee.item },
    lines: [{ ...coffee }],
    // ADR 0100: invoiced in the venue's Fortnox, paid there (mirrored by `invoice.sync`).
    money: {
      invoice: { provider: "FORTNOX", paid: true, sentDay: -43, dueDay: -13, paidDay: -30 },
    },
  },
  {
    title: "Rask family island trip",
    ...{ ref: "VW2", customer: "Familjen Rask", type: "Round trip", day: -80, won: true },
    ...{ from: "10:00", to: "11:30", status: "Completed", headcount: 9, ...people },
    ...{ quote: coffee.item },
    lines: [{ ...coffee }],
    // ADR 0100: invoiced in Visma eEkonomi, still open with a credit note of 100 kr.
    money: {
      invoice: {
        provider: "VISMA",
        paid: false,
        sentDay: -78,
        dueDay: -48,
        credit: { kr: 100, reason: "Two guests cancelled" },
      },
    },
  },
  {
    // Won and not invoiced yet: the dashboard's value booked ahead (the others are invoiced).
    title: "Rask family autumn trip",
    ...{ ref: "VW3", customer: "Familjen Rask", type: "Round trip", day: -20, won: true },
    ...{ from: "10:00", to: "11:30", status: "Completed", headcount: 12, ...people },
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
