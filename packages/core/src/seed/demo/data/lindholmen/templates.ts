import type { DemoTicketTemplate } from "../../template-types";

/**
 * Lindholmen's predefined tickets (`docs/demo-seed.md`, Predefined tickets): a small meeting
 * (room and coffee) and an afternoon break. Both start in Confirmed, so the grid books the room
 * and orders the food when a ticket is made from them (ADR 0044).
 */
export const lindholmenTemplates: readonly DemoTicketTemplate[] = [
  {
    ...{ name: "Small meeting", type: "Conference", status: "Confirmed" },
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
    lines: [
      {
        ...{ item: "Donsö", setup: "Boardroom", name: "Afternoon break room" },
        ...{ offsetMinutes: 0, durationMinutes: 180 },
      },
      {
        ...{ item: "Afternoon break", name: "Afternoon break buffet" },
        ...{ offsetMinutes: 60, durationMinutes: 30 },
      },
    ],
  },
];
