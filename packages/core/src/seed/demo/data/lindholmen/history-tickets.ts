import type { DemoTicket } from "../../ticket-types";

const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";

/**
 * Lindholmen's past events (`docs/demo-seed.md`, Tickets), Completed and invoiced afterwards
 * (ADR 0077): L1 is paid by card, L2 is unpaid and five days overdue, so the Financials page
 * shows both received and overdue money.
 */
export const lindholmenHistoryTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "L1", customer: hisingen, type: "Conference", day: -21, from: "08:30", to: "17:00" },
    ...{ status: "Completed", headcount: 40, assignee: "Johan Ek", followers: ["Erik Lund"] },
    fields: { Purpose: "Kickoff", Host: "Mats Olsson" },
    lines: [{ item: "Conference lunch", name: "Lunch", from: "12:00", to: "13:00" }],
    // ADR 0077: invoiced after the event and paid by card.
    money: { invoice: { paid: true, dueDay: 30 } },
  },
  {
    ...{ ref: "L2", customer: kvarnby, type: "Event", day: -10, from: "17:00", to: "23:00" },
    ...{ status: "Completed", headcount: 80, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
    fields: { Dresscode: "Blazer" },
    lines: [{ item: "Three-course dinner", name: "Dinner", from: "19:00", to: "22:00" }],
    // ADR 0077: invoiced, unpaid and five days overdue (aging on the Financials page).
    money: { invoice: { paid: false, dueDay: -5 } },
  },
];
