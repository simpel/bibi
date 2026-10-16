import type { BookingStatusDto } from "@okazi/core";
import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/**
 * What the booking pages read besides the booking: booking types and lists (own fields), the
 * customers to pick from, the members who can own a booking (`id` = user id) and the statuses.
 */
export type BookingFormData = TypedFormData & {
  customers: NamedOption[];
  members: NamedOption[];
  statuses: BookingStatusDto[];
};
