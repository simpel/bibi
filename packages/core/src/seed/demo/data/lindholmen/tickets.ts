import type { DemoTicket } from "../../ticket-types";

const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";
const gota = "Göta Advokatbyrå KB";
const vinga = { item: "Vinga (auditorium)", from: "09:00", to: "17:00" };

/**
 * Lindholmen's tickets (`docs/demo-seed.md`, Tickets) with a main assignee (the coordinator, or
 * the salesperson) and the salesperson as follower (ADR 0034). Until the organization's own
 * phases are seeded (#271), the phases are those of the default template (Lead, Confirmed,
 * Completed, Lost): open tickets after the deal are Confirmed, a cancelled one is Lost. The leads
 * F2, F3 and F6 stay in the entry phase with a room line in its initial state, Prebooked (a soft
 * hold, ADR 0044): F2 and F3 hold Vinga at the same time, F6's holdsUntil has passed.
 */
export const lindholmenTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "L1", customer: hisingen, type: "Conference", day: -21, from: "08:30", to: "17:00" },
    ...{ phase: "Completed", headcount: 40, assignee: "Johan Ek", followers: ["Erik Lund"] },
    fields: { Purpose: "Kickoff" },
  },
  {
    ...{ ref: "L2", customer: kvarnby, type: "Event", day: -10, from: "17:00", to: "23:00" },
    ...{ phase: "Completed", headcount: 80, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
    fields: { Dresscode: "Blazer" },
  },
  {
    ...{ ref: "L3", customer: "Västra Sjukvårdsregionen", type: "Conference", day: 3 },
    ...{
      from: "08:30",
      to: "23:00",
      phase: "Confirmed",
      headcount: 60,
      assignee: "Johan Ek",
      followers: ["Erik Lund", "Maria Holm"],
    },
    fields: { Purpose: "Strategy days" },
  },
  {
    ...{ ref: "L4", customer: gota, type: "Conference", day: 5, from: "09:00", to: "13:00" },
    ...{ phase: "Confirmed", headcount: 12, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
  },
  {
    ...{ ref: "L5", customer: "Älvstrand Tech AB", type: "Event", day: 14, from: "18:00" },
    ...{
      to: "23:30",
      phase: "Confirmed",
      headcount: 120,
      assignee: "Maria Holm",
      followers: ["Erik Lund"],
    },
    fields: { Dresscode: "Dark suit" },
  },
  {
    ...{ ref: "L6", customer: hisingen, type: "Conference", day: 30, from: "08:30", to: "17:00" },
    ...{ phase: "Lost", reason: "Budget", headcount: 25, assignee: "Erik Lund" },
  },
  {
    ...{ ref: "L7", customer: gota, type: "Conference", day: 1, from: "10:00", to: "12:00" },
    ...{ phase: "Confirmed", headcount: 4, assignee: "Sara Nilsson" },
  },
  {
    ...{ ref: "L8", customer: "Göteborgs Seglarsällskap", type: "Tour", day: 2, from: "14:00" },
    ...{
      to: "15:00",
      phase: "Confirmed",
      headcount: 22,
      assignee: "Johan Ek",
      followers: ["Sara Nilsson"],
    },
    fields: { "School class": false },
  },
  {
    ...{ ref: "L9", customer: kvarnby, type: "Conference", day: 8, from: "09:00", to: "16:00" },
    ...{ phase: "Confirmed", headcount: 18, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
  },
  {
    ...{ ref: "L10", customer: hisingen, type: "Conference", day: 4, from: "13:00", to: "16:00" },
    ...{ phase: "Confirmed", headcount: 6, assignee: "Johan Ek", followers: ["Erik Lund"] },
  },
  {
    ...{ ref: "F2", customer: hisingen, type: "Conference", day: 45, from: "09:00", to: "17:00" },
    ...{ headcount: 100, assignee: "Erik Lund", holdsUntilDay: 5 },
    fields: { Purpose: "Kickoff" },
    lines: [{ ...vinga, name: "Kickoff" }],
  },
  {
    ...{ ref: "F3", customer: kvarnby, type: "Conference", day: 45, from: "09:00", to: "17:00" },
    ...{ headcount: 80, assignee: "Sara Nilsson", holdsUntilDay: 5 },
    fields: { Purpose: "Product launch" },
    lines: [{ ...vinga, name: "Product launch" }],
  },
  {
    ...{ ref: "F6", customer: "Älvstrand Tech AB", type: "Conference", day: 12, from: "09:00" },
    ...{ to: "16:00", headcount: 20, holdsUntilDay: -1 },
    fields: { Purpose: "Team day" },
    lines: [{ item: "Hönö", name: "Team day", from: "09:00", to: "16:00" }],
  },
];
