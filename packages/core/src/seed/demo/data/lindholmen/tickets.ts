import type { DemoTicket } from "../../ticket-types";
import { l4Lines, l11Choices } from "./ticket-choices";

const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";
const gota = "Göta Advokatbyrå KB";
const quoted = { quote: "Conference lunch" };
const vinga = { item: "Vinga (auditorium)", from: "09:00", to: "17:00" };

/**
 * Lindholmen's tickets (`docs/demo-seed.md`, Tickets) with a main assignee (the coordinator, or
 * the salesperson) and the salesperson as follower (ADR 0034). The phases are the
 * organization's own (`pipeline.ts`): open tickets after the deal are Confirmed, a lost one is
 * Lost. The leads F2, F3 and F6 stay before the quote with a room line in its initial state,
 * Prebooked (a soft hold, ADR 0044): F2 and F3 hold Vinga at the same time, F6's holdsUntil has passed. L4's
 * tickets in Quote sent and Confirmed get a Conference lunch line (unless they have one) and a
 * quote of their priced lines that is sent and, for Confirmed, accepted: the quote events of the
 * phases move them (ADR 0043, 0052). L4's lunch changes after its quote was accepted. L4's
 * Styrsö and sound lines are Booked by the grid when L4 is confirmed. L11 waits in Quote sent with its lunch
 * overridden to Locked; L12 soft-holds Styrsö inside L4's booking, so its move to Confirmed is
 * blocked (both used by `checkDemoGrid`).
 */
export const lindholmenTickets: readonly DemoTicket[] = [
  {
    ...{ ref: "L1", customer: hisingen, type: "Conference", day: -21, from: "08:30", to: "17:00" },
    ...{ phase: "Completed", headcount: 40, assignee: "Johan Ek", followers: ["Erik Lund"] },
    fields: { Purpose: "Kickoff", Host: "Mats Olsson" },
  },
  {
    ...{ ref: "L2", customer: kvarnby, type: "Event", day: -10, from: "17:00", to: "23:00" },
    ...{ phase: "Completed", headcount: 80, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
    fields: { Dresscode: "Blazer" },
  },
  {
    ...quoted,
    ...{ ref: "L3", customer: "Västra Sjukvårdsregionen", type: "Conference", day: 3 },
    money: { deposit: { description: "Advance at confirmation", amountKr: 5_000 } },
    ...{
      from: "08:30",
      to: "23:00",
      phase: "Confirmed",
      headcount: 60,
      assignee: "Johan Ek",
      followers: ["Erik Lund", "Maria Holm"],
    },
    fields: { Purpose: "Strategy days", Host: "Eva Sund" },
  },
  {
    ...quoted,
    ...{ ref: "L4", customer: gota, type: "Conference", day: 5, from: "09:00", to: "13:00" },
    ...{ phase: "Confirmed", headcount: 12, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
    lines: l4Lines,
    // ADR 0052: two more for lunch after the customer accepted; the accepted quote shows it.
    changeAfterQuote: { line: "Conference lunch", quantity: 14 },
  },
  {
    ...quoted,
    ...{ ref: "L5", customer: "Älvstrand Tech AB", type: "Event", day: 14, from: "18:00" },
    // ADR 0057: 10 000 kr of the accepted quote is paid; the rest is the balance.
    money: { paidKr: 10_000 },
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
    ...{ template: "Small meeting", phase: "Confirmed", headcount: 4, assignee: "Sara Nilsson" },
  },
  {
    ...quoted,
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
    ...quoted,
    ...{ ref: "L9", customer: kvarnby, type: "Conference", day: 8, from: "09:00", to: "16:00" },
    ...{ phase: "Confirmed", headcount: 18, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
  },
  {
    ...{ ref: "L10", customer: hisingen, type: "Conference", day: 4, from: "13:00", to: "16:00" },
    ...{ template: "Afternoon break", phase: "Confirmed", headcount: 6, assignee: "Johan Ek" },
    followers: ["Erik Lund"],
  },
  {
    ...quoted,
    ...{ ref: "L11", customer: gota, type: "Conference", day: 6, from: "09:00", to: "13:00" },
    ...{
      phase: "Quote sent",
      headcount: 10,
      assignee: "Maria Holm",
      checkMove: { to: "Confirmed", blocked: false },
    },
    choices: l11Choices,
    fields: { Purpose: "Board meeting" },
    lines: [
      // ADR 0052: an agreed room price (950 kr in the item) and a flat fee without a time.
      { item: "Styrsö", name: "Board meeting", from: "09:00", to: "12:00", unitPriceKr: 800 },
      { item: "Projector", name: "Projector hire", quantity: 1 },
      {
        item: "Conference lunch",
        name: "Board lunch",
        from: "12:00",
        to: "13:00",
        state: "Locked",
      },
    ],
  },
  {
    ...{ ref: "L12", customer: hisingen, type: "Conference", day: 5, from: "10:00", to: "12:00" },
    ...quoted,
    ...{ headcount: 8, assignee: "Erik Lund", checkMove: { to: "Confirmed", blocked: true } },
    fields: { Purpose: "Strategy meeting" },
    lines: [{ item: "Styrsö", name: "Strategy meeting", from: "10:00", to: "12:00" }],
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
