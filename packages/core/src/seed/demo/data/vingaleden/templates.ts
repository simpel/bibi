import type { DemoTicketTemplate } from "../../template-types";

/**
 * Vingaleden's predefined ticket (`docs/demo-seed.md`, Predefined tickets): a standard trip with
 * its add-on for every guest, starting in the entry status, Request (soft holds, ADR 0044).
 */
export const vingaledenTemplates: readonly DemoTicketTemplate[] = [
  {
    ...{ name: "Lighthouse tour with blankets", type: "Round trip", status: "Request" },
    lines: [
      {
        ...{ item: "Lighthouse tour to Vinga", name: "Lighthouse tour" },
        ...{ offsetMinutes: 0, durationMinutes: 90 },
      },
      {
        ...{ item: "Blankets and rain gear", name: "Blankets and rain gear" },
        ...{ offsetMinutes: 0, durationMinutes: 90 },
      },
    ],
  },
];
