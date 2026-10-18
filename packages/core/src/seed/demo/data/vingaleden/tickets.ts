import type { DemoTicket } from "../../ticket-types";

const hisingen = "Hisingen Energi AB";
const people = { assignee: "Per Vinga", followers: ["Stina Holm"] };

/**
 * Vingaleden's tickets (`docs/demo-seed.md`, Customers and tickets). Per Vinga is assigned and
 * Stina Holm, who sells, follows (ADR 0034). The phases are Vingaleden's own (`pipeline.ts`):
 * V2 is called off for weather, V3 is past its second weather check and V4 waits in Weather hold.
 */
export const vingaledenTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "V1", customer: hisingen, type: "Charter", day: -7, from: "18:00", to: "20:30" },
    ...{ phase: "Completed", headcount: 40, ...people },
  },
  {
    ...{ ref: "V2", customer: "Kvarnby Design AB", type: "Charter", day: -2, from: "18:00" },
    ...{ to: "20:30", phase: "Called off – weather", reason: "Weather", headcount: 20, ...people },
  },
  {
    ...{ ref: "V3", customer: "Familjen Rask", type: "Round trip", day: 2, from: "10:00" },
    ...{ to: "11:30", phase: "Weather OK", headcount: 9, ...people },
  },
  {
    ...{ ref: "V4", customer: hisingen, type: "Charter", day: 10, from: "17:00", to: "19:30" },
    ...{ phase: "Weather hold", headcount: 60, assignee: "Stina Holm" },
  },
];
