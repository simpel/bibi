import type { EntityTypeDto, InquiryDto } from "@okazi/core";
import { NONE } from "@/components/form/option-select-field";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the inquiry form: inputs are strings, times `datetime-local` values. */
export type InquiryFormValues = {
  entityTypeId: string;
  customerId: string;
  /** A contact id, or `NONE`. */
  contactId: string;
  desiredStartsAt: string;
  desiredEndsAt: string;
  quantity: string;
  /** The budget in whole currency units (stored in minor units). */
  budget: string;
  fields: Record<string, RawFieldValue>;
};

export type InquiryDefaultsInput = {
  type: EntityTypeDto | undefined;
  inquiry?: InquiryDto | undefined;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

const local = ({ date }: { date: Date | null | undefined }) =>
  date ? toLocalInputValue({ date }) : "";

export function inquiryFormDefaults({ type, inquiry }: InquiryDefaultsInput): InquiryFormValues {
  const budget = inquiry?.budgetMinor;
  return {
    entityTypeId: type?.id ?? "",
    customerId: inquiry?.customerId ?? "",
    contactId: inquiry?.contactId ?? NONE,
    desiredStartsAt: local({ date: inquiry?.desiredStartsAt }),
    desiredEndsAt: local({ date: inquiry?.desiredEndsAt }),
    quantity: text({ value: inquiry?.quantity }),
    budget: text({ value: budget === null || budget === undefined ? budget : budget / 100 }),
    fields: rawFields({ type, stored: inquiry?.fields ?? {} }),
  };
}
