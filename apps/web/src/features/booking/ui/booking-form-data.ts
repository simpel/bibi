import type { BookingStatusDto } from "@okazi/core";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

export type NamedOption = { id: string; name: string };

/**
 * What the booking pages read besides the booking: booking types and lists (own fields), the
 * customers to pick from, the members who can own a booking (`id` = user id) and the statuses.
 */
export type BookingFormData = TypedFormData & {
  customers: NamedOption[];
  members: NamedOption[];
  statuses: BookingStatusDto[];
};

export type NameOfInput = { options: readonly NamedOption[]; id: string | null };

/** The option's name, or "–" when unset or unknown. */
export const nameOf = ({ options, id }: NameOfInput): string =>
  (id ? options.find((option) => option.id === id)?.name : undefined) ?? "–";
