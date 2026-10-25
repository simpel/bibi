import type { CalendarState } from "../../components/availability-calendar/calendar-types";

/**
 * The fixed stage palette: a state picks a stage, never a color. Amber tentative, blue ordered,
 * green confirmed, matching the item-state templates (`item-state-templates.ts`). Released lines
 * are never drawn. Today the app stores a free hex per state; the settings change is a ticket.
 */
export const STAGE_COLORS = {
  tentative: { color: "var(--warning)", ink: "var(--warning-foreground)" },
  ordered: { color: "var(--chart-4)", ink: "var(--primary-foreground)" },
  confirmed: { color: "var(--success)", ink: "var(--success-foreground)" },
} as const;

export const STATES = {
  prebooked: { name: "Prebooked", ...STAGE_COLORS.tentative, hold: "soft" },
  estimated: { name: "Estimated", ...STAGE_COLORS.tentative, hold: "none" },
  ordered: { name: "Ordered", ...STAGE_COLORS.ordered, hold: "none" },
  booked: { name: "Booked", ...STAGE_COLORS.confirmed, hold: "hard" },
  active: { name: "Active", ...STAGE_COLORS.confirmed, hold: "hard" },
  /** Not a sold line: grey, so it can never be read as a state. */
  maintenance: {
    name: "Maintenance",
    color: "var(--input)",
    ink: "var(--foreground)",
    hold: "hard",
  },
} satisfies Record<string, CalendarState>;
