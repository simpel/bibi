import type { BookingFormData, NamedOption } from "../../booking/ui/booking-form-data";

/** What the series pages read: the booking data plus bookable items and setups. */
export type SeriesFormData = BookingFormData & { rooms: NamedOption[]; setups: NamedOption[] };
