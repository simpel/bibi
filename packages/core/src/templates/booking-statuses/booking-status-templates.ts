import type { BookingStatusTemplate } from "./booking-status-template";
import { conferenceVenueBookingStatuses } from "./conference-venue";
import { defaultBookingStatuses } from "./default";

export const BOOKING_STATUS_TEMPLATE_KEYS = ["default", "conference-venue"] as const;
export type BookingStatusTemplateKey = (typeof BOOKING_STATUS_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<BookingStatusTemplateKey, BookingStatusTemplate> = {
  default: defaultBookingStatuses,
  "conference-venue": conferenceVenueBookingStatuses,
};

export type GetBookingStatusTemplateInput = { key: BookingStatusTemplateKey };

export function getBookingStatusTemplate({
  key,
}: GetBookingStatusTemplateInput): BookingStatusTemplate {
  return TEMPLATES[key];
}
