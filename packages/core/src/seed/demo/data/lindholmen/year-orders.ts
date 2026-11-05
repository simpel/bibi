import type { DemoOrder } from "../../order-types";
import { buffet, coffee, dinner, lunch, past, room } from "./past-order";

const nordkust = "Nordkust Logistik AB";
const region = "Västra Sjukvårdsregionen";
const alvstrand = "Älvstrand Tech AB";
const sailing = "Göteborgs Seglarsällskap";
const gota = "Göta Advokatbyrå KB";
const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";

/**
 * A year of Lindholmen's invoiced events (ADR 0077, `docs/demo-seed.md`, Finance) so the
 * Financials charts have history: each month invoiced and paid, one partial refund (L19), and
 * open invoices in every aging bucket (L23 over 60 days, L25 31–60, L28 not due; L2 is 1–30).
 */
export const lindholmenYearOrders: readonly DemoOrder[] = [
  past({
    title: "Nordkust annual conference",
    ref: "L16",
    customer: nordkust,
    type: "Conference",
    day: -325,
    headcount: 60,
    lines: [room({ item: "Vinga (auditorium)" }), lunch],
    paidDay: -300,
  }),
  past({
    title: "Region workshop",
    ref: "L17",
    customer: region,
    type: "Conference",
    day: -305,
    headcount: 30,
    lines: [room({ item: "Hönö" }), lunch, coffee],
    paidDay: -280,
  }),
  past({
    title: "Älvstrand summer party",
    ref: "L18",
    customer: alvstrand,
    type: "Event",
    day: -270,
    headcount: 45,
    lines: [buffet, dinner],
    paidDay: -251,
  }),
  past({
    title: "Seglarsällskapet season opening",
    ref: "L19",
    customer: sailing,
    type: "Event",
    day: -240,
    headcount: 70,
    lines: [buffet, coffee],
    paidDay: -215,
    refund: { kr: 2000, day: -200 },
  }),
  past({
    title: "Göta client seminar",
    ref: "L20",
    customer: gota,
    type: "Conference",
    day: -212,
    headcount: 12,
    lines: [room({ item: "Styrsö" }), lunch],
    paidDay: -190,
  }),
  past({
    title: "Hisingen Energi quarterly meeting",
    ref: "L21",
    customer: hisingen,
    type: "Conference",
    day: -180,
    headcount: 50,
    lines: [room({ item: "Vinga (auditorium)" }), lunch, coffee],
    paidDay: -152,
  }),
  past({
    title: "Kvarnby studio day",
    ref: "L22",
    customer: kvarnby,
    type: "Event",
    day: -150,
    headcount: 35,
    lines: [room({ item: "Vrångö" }), dinner],
    paidDay: -126,
  }),
  past({
    title: "Nordkust planning conference",
    ref: "L23",
    customer: nordkust,
    type: "Conference",
    day: -120,
    headcount: 25,
    lines: [room({ item: "Öckerö" }), lunch],
  }),
  past({
    title: "Region leadership forum",
    ref: "L24",
    customer: region,
    type: "Conference",
    day: -95,
    headcount: 28,
    lines: [room({ item: "Hönö" }), lunch],
    paidDay: -70,
  }),
  past({
    title: "Älvstrand Christmas dinner",
    ref: "L25",
    customer: alvstrand,
    type: "Event",
    day: -80,
    headcount: 40,
    lines: [buffet],
  }),
  past({
    title: "Seglarsällskapet annual meeting",
    ref: "L26",
    customer: gota,
    type: "Conference",
    day: -62,
    headcount: 10,
    lines: [room({ item: "Styrsö" }), lunch, coffee],
    paidDay: -41,
  }),
  past({
    title: "Göta partner dinner",
    ref: "L27",
    customer: sailing,
    type: "Event",
    day: -45,
    headcount: 55,
    lines: [dinner],
    paidDay: -20,
  }),
  past({
    title: "Hisingen Energi board day",
    ref: "L28",
    customer: hisingen,
    type: "Conference",
    day: -7,
    headcount: 18,
    lines: [room({ item: "Donsö" }), lunch],
    dueAfter: 30,
  }),
];
