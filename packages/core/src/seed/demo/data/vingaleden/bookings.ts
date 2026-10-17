import type { DemoBooking } from "../../booking-types";

const hisingen = "Hisingen Energi AB";
const people = { assignee: "Per Vinga", followers: ["Stina Holm"] };

/**
 * Vingaleden's bookings (`docs/demo-seed.md`, Customers and bookings). Per Vinga is assigned and
 * Stina Holm, who sells, follows (ADR 0034). The statuses follow with `booking.changeStatus`;
 * until then every booking has the default `TENTATIVE` status.
 */
export const vingaledenBookings: readonly DemoBooking[] = [
  {
    ...{ ref: "V1", customer: hisingen, type: "Charter", day: -7, from: "18:00", to: "20:30" },
    ...{ headcount: 40, ...people },
  },
  {
    ...{ ref: "V2", customer: "Kvarnby Design AB", type: "Charter", day: -2, from: "18:00" },
    ...{ to: "20:30", headcount: 20, ...people },
  },
  {
    ...{ ref: "V3", customer: "Familjen Rask", type: "Round trip", day: 2, from: "10:00" },
    ...{ to: "11:30", headcount: 9, ...people },
  },
  {
    ...{ ref: "V4", customer: hisingen, type: "Charter", day: 10, from: "17:00", to: "19:30" },
    ...{ headcount: 60, assignee: "Stina Holm" },
  },
];
