import type { EntityTypeDto, TicketDto } from "@bibi/core";
import { NONE } from "@/components/form/option-select-field";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the ticket form: inputs are strings, times `datetime-local` values. */
export type TicketFormValues = {
  entityTypeId: string;
  customerId: string;
  /** A contact id, or `NONE`. */
  contactId: string;
  desiredStartsAt: string;
  desiredEndsAt: string;
  estimatedHeadcount: string;
  guaranteedHeadcount: string;
  /** The budget in whole currency units (stored in minor units). */
  budget: string;
  /** Soft holds expire after this time (ADR 0044); empty: they never do. */
  holdsUntil: string;
  fields: Record<string, RawFieldValue>;
};

export type TicketDefaultsInput = {
  type: EntityTypeDto | undefined;
  ticket?: TicketDto | undefined;
  /** The organization's zone: ticket-level times show in it (ADR 0064). */
  timeZone: string;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export function ticketFormDefaults({
  type,
  ticket,
  timeZone,
}: TicketDefaultsInput): TicketFormValues {
  const budget = ticket?.budgetMinor;
  const local = ({ date }: { date: Date | null | undefined }) =>
    date ? toLocalInputValue({ date, timeZone }) : "";
  return {
    entityTypeId: type?.id ?? "",
    customerId: ticket?.customerId ?? "",
    contactId: ticket?.contactId ?? NONE,
    desiredStartsAt: local({ date: ticket?.desiredStartsAt }),
    desiredEndsAt: local({ date: ticket?.desiredEndsAt }),
    estimatedHeadcount: text({ value: ticket?.estimatedHeadcount }),
    guaranteedHeadcount: text({ value: ticket?.guaranteedHeadcount }),
    budget: text({ value: budget === null || budget === undefined ? budget : budget / 100 }),
    holdsUntil: local({ date: ticket?.holdsUntil }),
    fields: rawFields({ type, stored: ticket?.fields ?? {} }),
  };
}
