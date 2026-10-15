import type { BookingStatusTemplate } from "./booking-status-template";

/**
 * One status per phase (ADR 0022). Every new organization gets it at creation, so bookings work
 * immediately. Forward, and to Cancelled until the booking is completed.
 */
export const defaultBookingStatuses: BookingStatusTemplate = {
  key: "default",
  name: "Default",
  statuses: [
    { name: "Tentative", color: "#f59e0b", phase: "TENTATIVE" },
    { name: "Confirmed", color: "#16a34a", phase: "CONFIRMED" },
    { name: "Completed", color: "#2563eb", phase: "COMPLETED" },
    { name: "Cancelled", color: "#6b7280", phase: "CANCELLED" },
  ],
  transitions: [
    ["Tentative", "Confirmed"],
    ["Tentative", "Cancelled"],
    ["Confirmed", "Completed"],
    ["Confirmed", "Cancelled"],
  ],
};
