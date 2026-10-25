import type { WebSurface } from "./web-surfaces";

/** The calendar (ADR 0064) and the weekly hours with dated exceptions that shape it (rule 10). */
export const BOOKING_SURFACES: readonly WebSurface[] = [
  // The calendar shows the occupancy of every space by day or week.
  { operation: "occupancy.list", route: "/calendar" },
  // One hours editor on the venue and item pages.
  { operation: "venueHours.get", route: "/venues/[id]" },
  { operation: "venueHours.set", route: "/venues/[id]" },
  { operation: "itemHours.get", route: "/items/[id]" },
  { operation: "itemHours.set", route: "/items/[id]" },
];
