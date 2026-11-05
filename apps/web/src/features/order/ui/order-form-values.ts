import type { EntityTypeDto, OrderDto } from "@bibi/core";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the order form: inputs are strings, times `datetime-local` values. */
export type OrderFormValues = {
  /** Empty: none (on create one is generated). */
  title: string;
  entityTypeId: string;
  customerId: string;
  /** A contact id; required (empty until picked). */
  contactId: string;
  desiredStartsAt: string;
  desiredEndsAt: string;
  estimatedHeadcount: string;
  guaranteedHeadcount: string;
  /** The budget in whole currency units (stored in minor units). */
  budget: string;
  /** The estimated value in whole currency units (stored in minor units, with history). */
  estimatedValue: string;
  /** Soft holds expire after this time (ADR 0044); empty: they never do. */
  holdsUntil: string;
  /** Booking-level notes; empty: none. */
  note: string;
  fields: Record<string, RawFieldValue>;
};

export type OrderDefaultsInput = {
  type: EntityTypeDto | undefined;
  order?: OrderDto | undefined;
  /** The organization's zone: order-level times show in it (ADR 0064). */
  timeZone: string;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export function orderFormDefaults({ type, order, timeZone }: OrderDefaultsInput): OrderFormValues {
  const budget = order?.budgetMinor;
  const estimate = order?.estimatedValueMinor;
  const local = ({ date }: { date: Date | null | undefined }) =>
    date ? toLocalInputValue({ date, timeZone }) : "";
  return {
    title: order?.title ?? "",
    entityTypeId: type?.id ?? "",
    customerId: order?.customerId ?? "",
    contactId: order?.contactId ?? "",
    desiredStartsAt: local({ date: order?.desiredStartsAt }),
    desiredEndsAt: local({ date: order?.desiredEndsAt }),
    estimatedHeadcount: text({ value: order?.estimatedHeadcount }),
    guaranteedHeadcount: text({ value: order?.guaranteedHeadcount }),
    budget: text({ value: budget === null || budget === undefined ? budget : budget / 100 }),
    estimatedValue: text({
      value: estimate === null || estimate === undefined ? estimate : estimate / 100,
    }),
    holdsUntil: local({ date: order?.holdsUntil }),
    note: order?.note ?? "",
    fields: rawFields({ type, stored: order?.fields ?? {} }),
  };
}
