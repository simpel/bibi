import { itemHoursOperations } from "../features/item/hours-operations";
import { venueHoursOperations } from "../features/venue/hours-operations";

/** Venue opening hours and item working hours (ADR 0064 rule 10). */
export const hoursOperations = [...venueHoursOperations, ...itemHoursOperations];
