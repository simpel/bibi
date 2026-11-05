"use client";

import {
  type BookingDetailsProps,
  CalendarHoverDetails,
} from "../cursor-hover/cursor-hover-details";

export type { BookingDetailsProps };

/**
 * Unified booking hover details. Delegated to CalendarHoverDetails.
 */
export const BookingDetails = CalendarHoverDetails;
