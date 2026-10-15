import type { DemoBooking } from "../../booking-types";

const hisingen = "Hisingen Energi AB";
const kvarnby = "Kvarnby Design AB";
const gota = "Göta Advokatbyrå KB";

/**
 * Lindholmen's bookings (`docs/demo-seed.md`, Bookings) with salesperson and coordinator. The
 * statuses in the spec are set when `booking.changeStatus` exists; until then every booking has
 * the default `TENTATIVE` status.
 */
export const lindholmenBookings: readonly DemoBooking[] = [
  {
    ...{ ref: "L1", customer: hisingen, type: "Conference", day: -21, from: "08:30", to: "17:00" },
    ...{ headcount: 40, sales: "Erik Lund", coordinator: "Johan Ek" },
    fields: { Purpose: "Kickoff" },
  },
  {
    ...{ ref: "L2", customer: kvarnby, type: "Event", day: -10, from: "17:00", to: "23:00" },
    ...{ headcount: 80, sales: "Sara Nilsson", coordinator: "Maria Holm" },
    fields: { Dresscode: "Blazer" },
  },
  {
    ...{ ref: "L3", customer: "Västra Sjukvårdsregionen", type: "Conference", day: 3 },
    ...{ from: "08:30", to: "23:00", headcount: 60, sales: "Erik Lund", coordinator: "Johan Ek" },
    fields: { Purpose: "Strategy days" },
  },
  {
    ...{ ref: "L4", customer: gota, type: "Conference", day: 5, from: "09:00", to: "13:00" },
    ...{ headcount: 12, sales: "Sara Nilsson", coordinator: "Maria Holm" },
  },
  {
    ...{ ref: "L5", customer: "Älvstrand Tech AB", type: "Event", day: 14, from: "18:00" },
    ...{ to: "23:30", headcount: 120, sales: "Erik Lund", coordinator: "Maria Holm" },
    fields: { Dresscode: "Dark suit" },
  },
  {
    ...{ ref: "L6", customer: hisingen, type: "Conference", day: 30, from: "08:30", to: "17:00" },
    ...{ headcount: 25, sales: "Erik Lund" },
  },
  {
    ...{ ref: "L7", customer: gota, type: "Conference", day: 1, from: "10:00", to: "12:00" },
    ...{ headcount: 4, sales: "Sara Nilsson" },
  },
  {
    ...{ ref: "L8", customer: "Göteborgs Seglarsällskap", type: "Tour", day: 2, from: "14:00" },
    ...{ to: "15:00", headcount: 22, sales: "Sara Nilsson", coordinator: "Johan Ek" },
    fields: { "School class": false },
  },
  {
    ...{ ref: "L9", customer: kvarnby, type: "Conference", day: 8, from: "09:00", to: "16:00" },
    ...{ headcount: 18, sales: "Sara Nilsson", coordinator: "Maria Holm" },
  },
  {
    ...{ ref: "L10", customer: hisingen, type: "Conference", day: 4, from: "13:00", to: "16:00" },
    ...{ headcount: 6, sales: "Erik Lund", coordinator: "Johan Ek" },
  },
];
