import type { BookingDto, EntityTypeDto } from "@okazi/core";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the booking form: inputs are strings, times `datetime-local` values. */
export type BookingFormValues = {
  entityTypeId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  estimatedHeadcount: string;
  guaranteedHeadcount: string;
  fields: Record<string, RawFieldValue>;
};

export type BookingDefaultsInput = {
  type: EntityTypeDto | undefined;
  booking?: BookingDto | undefined;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

const local = ({ date }: { date: Date | undefined }) => (date ? toLocalInputValue({ date }) : "");

export function bookingFormDefaults({ type, booking }: BookingDefaultsInput): BookingFormValues {
  return {
    entityTypeId: type?.id ?? "",
    customerId: booking?.customerId ?? "",
    startsAt: local({ date: booking?.startsAt }),
    endsAt: local({ date: booking?.endsAt }),
    estimatedHeadcount: text({ value: booking?.estimatedHeadcount }),
    guaranteedHeadcount: text({ value: booking?.guaranteedHeadcount }),
    fields: rawFields({ type, stored: booking?.fields ?? {} }),
  };
}
