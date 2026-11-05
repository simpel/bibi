import type { DemoOrder } from "../../order-types";

const lunch = { quote: "Conference lunch" };
const room = ({ item, name }: { item: string; name: string }) => ({
  item,
  name,
  from: "09:00",
  to: "16:00",
});

/**
 * Lindholmen's closed orders for the dashboard (ADR 0079, `docs/demo-seed.md`, Dashboard data):
 * three won (an accepted quote, then Completed) and two lost (Lost and Cancelled, no accepted
 * quote), with the values their quotes and estimates give. Their lines are released on closing.
 * L13 is the open one: its count is locked, which needs an accepted quote.
 */
export const lindholmenClosedOrders: readonly DemoOrder[] = [
  {
    title: "Nordkust management team days",
    ...{ ...lunch, won: true, ref: "W1", customer: "Nordkust Logistik AB", type: "Conference" },
    ...{ day: -40, from: "09:00", to: "16:00", status: "Completed", headcount: 30 },
    ...{ assignee: "Johan Ek", followers: ["Erik Lund", "Anna Berg"] },
    fields: { Purpose: "Management team" },
    lines: [room({ item: "Hönö", name: "Management days" })],
  },
  {
    title: "Region training day",
    ...{ ...lunch, won: true, ref: "W2", customer: "Västra Sjukvårdsregionen", type: "Conference" },
    ...{ day: -75, from: "09:00", to: "16:00", status: "Completed", headcount: 45 },
    ...{ assignee: "Maria Holm", followers: ["Sara Nilsson", "Anna Berg"] },
    fields: { Purpose: "Training day" },
    lines: [room({ item: "Vinga (auditorium)", name: "Training day" })],
  },
  {
    title: "Älvstrand spring hackathon",
    ...{ ...lunch, won: true, ref: "W3", customer: "Älvstrand Tech AB", type: "Conference" },
    ...{ day: -110, from: "09:00", to: "16:00", status: "Completed", headcount: 20 },
    ...{ assignee: "Erik Lund", estimatesKr: [40_000] },
    fields: { Purpose: "Hackathon" },
    lines: [room({ item: "Styrsö", name: "Hackathon" })],
  },
  {
    title: "Göta partner meeting",
    ...{ ref: "X1", customer: "Göta Advokatbyrå KB", type: "Conference", day: -55 },
    ...{ from: "09:00", to: "16:00", status: "Lost", reason: "Went to a competitor" },
    ...{ headcount: 35, assignee: "Sara Nilsson", estimatesKr: [72_000, 64_000] },
    fields: { Purpose: "Partner meeting" },
  },
  {
    title: "Seglarsällskapet board meeting",
    ...{ ref: "X2", customer: "Göteborgs Seglarsällskap", type: "Conference", day: -95 },
    ...{ from: "09:00", to: "16:00", status: "Cancelled", reason: "Budget" },
    ...{ headcount: 15, assignee: "Johan Ek", estimatesKr: [28_000] },
    fields: { Purpose: "Board meeting" },
  },
  {
    title: "Kvarnby design sprint",
    // ADR 0079: the count is locked, which needs an accepted quote (it is made and accepted first).
    ...{
      ...lunch,
      won: true,
      ref: "L13",
      customer: "Kvarnby Design AB",
      type: "Conference",
      day: 9,
    },
    ...{ from: "09:00", to: "16:00", status: "Final count locked", headcount: 28 },
    ...{ assignee: "Johan Ek", followers: ["Sara Nilsson"], estimatesKr: [54_000] },
    fields: { Purpose: "Design sprint" },
    lines: [{ item: "Brännö", name: "Design sprint", from: "09:00", to: "16:00" }],
  },
];
