import { type BookingStatusTemplate, forwardTransitions } from "./booking-status-template";

const statuses: BookingStatusTemplate["statuses"] = [
  { name: "Tentative", color: "#f59e0b", phase: "TENTATIVE" },
  { name: "Confirmed", color: "#16a34a", phase: "CONFIRMED" },
  { name: "Final count locked", color: "#0d9488", phase: "CONFIRMED" },
  { name: "Completed", color: "#2563eb", phase: "COMPLETED" },
  { name: "Cancelled", color: "#6b7280", phase: "CANCELLED" },
];

/**
 * "Conference venue" (ADR 0022): five statuses; every transition forward and to Cancelled is
 * allowed until the booking is completed. Shares names with the default statuses, so importing
 * it into a new organization adds only what is missing.
 */
export const conferenceVenueBookingStatuses: BookingStatusTemplate = {
  key: "conference-venue",
  name: "Conference venue",
  statuses,
  transitions: forwardTransitions({ statuses }),
};
