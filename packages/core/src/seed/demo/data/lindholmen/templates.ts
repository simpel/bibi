import type { DemoTicketTemplate } from "../../template-types";

/**
 * Lindholmen's predefined tickets (`docs/demo-seed.md`, Predefined tickets): a small meeting
 * (room and coffee), an afternoon break and a wine tasting (a room, a drink and equipment that needs a
 * technician from the pool). Both start in Confirmed, so the grid books the room
 * and orders the food when a ticket is made from them (ADR 0044). Each has a guest range (ADR 0081).
 */
export const lindholmenTemplates: readonly DemoTicketTemplate[] = [
  {
    ...{ name: "Small meeting", type: "Conference", status: "Confirmed" },
    ...{ minGuests: 2, maxGuests: 6 },
    lines: [
      {
        ...{ item: "Asperö", setup: "Boardroom", name: "Small meeting room" },
        ...{ offsetMinutes: 0, durationMinutes: 120 },
      },
      {
        ...{ item: "Coffee and tea", name: "Coffee and tea" },
        ...{ offsetMinutes: 0, durationMinutes: 120 },
      },
    ],
  },
  {
    ...{ name: "Afternoon break", type: "Conference", status: "Confirmed" },
    ...{ minGuests: 4, maxGuests: 30 },
    lines: [
      {
        ...{ item: "Öckerö", setup: "Cabaret", name: "Afternoon break room" },
        ...{ offsetMinutes: 0, durationMinutes: 180 },
      },
      {
        ...{ item: "Afternoon break", name: "Afternoon break buffet" },
        ...{ offsetMinutes: 60, durationMinutes: 30 },
        // ADR 0089: the package preselects the usual snack.
        options: ["Carrot cake"],
      },
    ],
  },
  {
    ...{ name: "Wine tasting", type: "Conference", status: "Confirmed" },
    ...{ minGuests: 8, maxGuests: 16 },
    lines: [
      {
        ...{ item: "Hönö", setup: "Cabaret", name: "Tasting room" },
        ...{ offsetMinutes: 0, durationMinutes: 180 },
      },
      {
        ...{ item: "Wine package (2 glasses)", name: "Wine tasting" },
        ...{ offsetMinutes: 30, durationMinutes: 90 },
      },
      {
        ...{ item: "Mobile sound system", name: "Sound for the tasting", quantity: 1 },
        ...{ offsetMinutes: 0, durationMinutes: 180 },
      },
    ],
  },
];
