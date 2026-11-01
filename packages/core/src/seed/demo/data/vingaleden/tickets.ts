import type { DemoTicket } from "../../ticket-types";
import { vingaledenClosedTickets } from "./closed-tickets";

const hisingen = "Hisingen Energi AB";
const people = { assignee: "Per Vinga", followers: ["Stina Holm"] };

/**
 * Vingaleden's tickets (`docs/demo-seed.md`, Customers and tickets). Per Vinga is assigned and
 * Stina Holm, who sells, follows (ADR 0034). The statuses are Vingaleden's own (`pipeline.ts`):
 * V2 is called off for weather, V3 is past its second weather check, V4 waits in Weather hold and
 * V5's soft hold on RIB Snabben runs out at D+4.
 */
export const vingaledenTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "V1", customer: hisingen, type: "Charter", day: -7, from: "18:00", to: "20:30" },
    ...{ status: "Completed", headcount: 40, ...people },
  },
  {
    ...{ ref: "V2", customer: "Kvarnby Design AB", type: "Charter", day: -2, from: "18:00" },
    ...{ to: "20:30", status: "Called off – weather", reason: "Weather", headcount: 20, ...people },
  },
  {
    ...{ ref: "V3", customer: "Familjen Rask", type: "Round trip", day: 2, from: "10:00" },
    ...{ to: "11:30", status: "Weather OK", headcount: 9, estimatesKr: [6_500], ...people },
  },
  {
    ...{ ref: "V4", customer: hisingen, type: "Charter", day: 10, from: "17:00", to: "19:30" },
    ...{ status: "Weather hold", headcount: 60, assignee: "Stina Holm", estimatesKr: [38_000] },
  },
  {
    ...{ ref: "V5", customer: "Familjen Rask", type: "Round trip", day: 16, from: "10:00" },
    ...{ to: "11:30", headcount: 12, estimatesKr: [9_000], holdsUntilDay: 4, ...people },
    // A soft hold that runs out within the week: the dashboard's attention list (ADR 0080).
    lines: [{ item: "RIB Snabben", name: "Round trip", from: "10:00", to: "11:30" }],
  },
  {
    ...{ ref: "V6", customer: "Kvarnby Design AB", type: "Charter", day: 21, from: "17:00" },
    ...{ to: "19:30", status: "Confirmed", headcount: 30, estimatesKr: [26_000], ...people },
  },
  // Last, so the fixtures keep their reference numbers.
  ...vingaledenClosedTickets,
];
