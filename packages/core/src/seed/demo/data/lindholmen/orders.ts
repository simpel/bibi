import type { DemoOrder } from "../../order-types";
import { lindholmenHistoryOrders } from "./history-orders";
import { l4Lines, l9Lines, l11Choices, l11Lines } from "./order-choices";

const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";
const gota = "Göta Advokatbyrå KB";
const quoted = { quote: "Conference lunch" };
const vinga = { item: "Vinga (auditorium)", from: "09:00", to: "17:00" };

/**
 * Lindholmen's orders (`docs/demo-seed.md`, Orders) with a main assignee (the coordinator, or
 * the salesperson) and the salesperson as follower (ADR 0034). The statuses are the
 * organization's own (`pipeline.ts`): open orders after the deal are Confirmed, a lost one is
 * Lost. The leads F2, F3 and F6 stay before the quote with a room line in its initial state,
 * Prebooked (a soft hold, ADR 0044): F2 and F3 hold Vinga at the same time, F6's holdsUntil has passed. L4's
 * orders in Quote sent and Confirmed get a Conference lunch line (unless they have one) and a
 * quote of their priced lines that is sent and, for Confirmed, accepted: the quote events of the
 * statuses move them (ADR 0043, 0052). L4's lunch changes after its quote was accepted. L4's
 * Styrsö and sound lines are Booked by the grid when L4 is confirmed. L11 waits in Quote sent with its lunch
 * overridden to Locked; L12 soft-holds Styrsö inside L4's booking, so its move to Confirmed is
 * blocked (both used by `checkDemoGrid`). L3, F2 and F3 have value estimates (ADR 0074).
 */
export const lindholmenOrders: readonly DemoOrder[] = [
  ...lindholmenHistoryOrders,
  {
    title: "Region strategy days",
    ...{ ...quoted, estimatesKr: [60_000, 85_000], note: "North entrance, invoice ref VSR-2291." },
    ...{ ref: "L3", customer: "Västra Sjukvårdsregionen", type: "Conference", day: 3 },
    money: { deposit: { description: "Advance at confirmation", amountKr: 5_000 } },
    ...{
      from: "08:30",
      to: "23:00",
      status: "Confirmed",
      headcount: 60,
      assignee: "Johan Ek",
      followers: ["Erik Lund", "Maria Holm", "Anna Berg"],
    },
    fields: { Purpose: "Strategy days", Host: "Eva Sund" },
  },
  {
    title: "Göta half-day conference",
    ...quoted,
    ...{ ref: "L4", customer: gota, type: "Conference", day: 5, from: "09:00", to: "13:00" },
    ...{ status: "Confirmed", headcount: 12, assignee: "Maria Holm" },
    followers: ["Sara Nilsson", "Anna Berg"],
    lines: l4Lines,
    // ADR 0052: two more for lunch after the customer accepted; the accepted quote shows it.
    changeAfterQuote: { line: "Conference lunch", quantity: 14 },
  },
  {
    title: "Älvstrand customer event",
    ...quoted,
    ...{ ref: "L5", customer: "Älvstrand Tech AB", type: "Event", day: 14, from: "18:00" },
    // ADR 0057: 10 000 kr of the accepted quote is paid; the rest is the balance.
    money: { paidKr: 10_000 },
    ...{
      to: "23:30",
      status: "Confirmed",
      headcount: 120,
      assignee: "Maria Holm",
      followers: ["Erik Lund", "Anna Berg"],
    },
    fields: { Dresscode: "Dark suit" },
  },
  {
    title: "Hisingen Energi team day",
    ...{ ref: "L6", customer: hisingen, type: "Conference", day: 30, from: "08:30", to: "17:00" },
    ...{ status: "Lost", reason: "Budget", headcount: 25, assignee: "Erik Lund" },
    followers: ["Anna Berg"],
  },
  {
    title: "Göta small meeting",
    ...{ ref: "L7", customer: gota, type: "Conference", day: 1, from: "10:00", to: "12:00" },
    ...{ template: "Small meeting", status: "Confirmed", headcount: 4, assignee: "Sara Nilsson" },
  },
  {
    title: "Seglarsällskapet harbour tour",
    ...quoted,
    ...{ ref: "L8", customer: "Göteborgs Seglarsällskap", type: "Tour", day: 2, from: "14:00" },
    ...{
      to: "15:00",
      status: "Confirmed",
      headcount: 22,
      assignee: "Anna Berg",
      followers: ["Sara Nilsson"],
    },
    fields: { "School class": false },
  },
  {
    title: "Kvarnby team day with dinner",
    ...quoted,
    ...{ ref: "L9", customer: kvarnby, type: "Conference", day: 8, from: "09:00", to: "20:00" },
    estimatesKr: [48_000],
    lines: l9Lines,
    ...{ status: "Confirmed", headcount: 18, assignee: "Maria Holm", followers: ["Sara Nilsson"] },
  },
  {
    title: "Hisingen Energi afternoon break",
    ...{ ref: "L10", customer: hisingen, type: "Conference", day: 4, from: "13:00", to: "16:00" },
    ...{ template: "Afternoon break", status: "Confirmed", headcount: 6, assignee: "Johan Ek" },
    followers: ["Erik Lund"],
  },
  {
    title: "Göta board meeting",
    ...quoted,
    ...{ ref: "L11", customer: gota, type: "Conference", day: 6, from: "09:00", to: "13:00" },
    ...{
      estimatesKr: [35_000],
      status: "Quote sent",
      headcount: 10,
      assignee: "Maria Holm",
      checkMove: { to: "Confirmed", blocked: false },
    },
    choices: l11Choices,
    fields: { Purpose: "Board meeting" },
    lines: l11Lines,
  },
  {
    title: "Hisingen Energi strategy meeting",
    ...{ ref: "L12", customer: hisingen, type: "Conference", day: 5, from: "10:00", to: "12:00" },
    estimatesKr: [22_000],
    ...quoted,
    ...{ headcount: 8, assignee: "Erik Lund", checkMove: { to: "Confirmed", blocked: true } },
    fields: { Purpose: "Strategy meeting" },
    lines: [{ item: "Styrsö", name: "Strategy meeting", from: "10:00", to: "12:00" }],
  },
  {
    title: "Hisingen Energi autumn kickoff",
    ...{ ref: "F2", customer: hisingen, type: "Conference", day: 45, from: "09:00", to: "17:00" },
    ...{ headcount: 100, assignee: "Erik Lund", holdsUntilDay: 5, estimatesKr: [150_000, 120_000] },
    fields: { Purpose: "Kickoff" },
    lines: [{ ...vinga, name: "Kickoff" }],
  },
  {
    title: "Kvarnby product launch",
    ...{ ref: "F3", customer: kvarnby, type: "Conference", day: 45, from: "09:00", to: "17:00" },
    ...{ headcount: 80, assignee: "Sara Nilsson", holdsUntilDay: 5, estimatesKr: [95_000] },
    fields: { Purpose: "Product launch" },
    lines: [{ ...vinga, name: "Product launch" }],
  },
  {
    title: "Älvstrand team day",
    ...{ ref: "F6", customer: "Älvstrand Tech AB", type: "Conference", day: 12, from: "09:00" },
    ...{ to: "16:00", headcount: 20, holdsUntilDay: -1 },
    fields: { Purpose: "Team day" },
    lines: [{ item: "Hönö", name: "Team day", from: "09:00", to: "16:00" }],
  },
];
