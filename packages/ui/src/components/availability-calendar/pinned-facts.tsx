"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { NumberFlow } from "../hero-number/hero-number";
import { ContactName } from "../person-contact/contact-name";
import type { FormatDate } from "./calendar-dates";
import { formatDay } from "./calendar-dates";
import { useCalendarLabels } from "./calendar-labels";
import { toMinutes } from "./calendar-time";
import type { PinnedBooking } from "./pins-context";

export type PinnedFactsProps = { booking: PinnedBooking; formatDate: FormatDate };

/** What it is worth, in the user's number format, counting to its new amount when it changes. */
export function PinnedValue({
  booking,
  className,
}: { booking: PinnedBooking } & { className?: string }) {
  const labels = useCalendarLabels();
  if (!booking.value) return null;
  const { amount, currency } = booking.value;
  return (
    <NumberFlow
      value={amount}
      {...labels.moneyFlow({ currency })}
      className={cn("tabular-nums", className)}
    />
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </>
  );
}

/** The booking's main facts: when, where, guests, state, who is on it, what it is worth. */
export function PinnedFacts({ booking, formatDate }: PinnedFactsProps) {
  const labels = useCalendarLabels();
  const time = [booking.start, booking.end]
    .map((at) => labels.clock({ minutes: toMinutes({ time: at }) }))
    .join("–");
  const day = formatDay({ date: booking.date, format: formatDate });
  const person = booking.contact?.person;
  return (
    <dl className="grid grid-cols-[4.5rem_1fr] items-baseline gap-x-3 gap-y-1.5 text-xs">
      <Fact label={labels.pinCard.when}>{`${day} · ${time}`}</Fact>
      {booking.assetName ? <Fact label={labels.pinCard.where}>{booking.assetName}</Fact> : null}
      <Fact label={labels.pinCard.state}>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ background: booking.state.color }}
          />
          {booking.state.name}
        </span>
      </Fact>
      {booking.headcount ? <Fact label={labels.pinCard.guests}>{booking.headcount}</Fact> : null}
      {person ? (
        <Fact label={labels.internal}>
          <ContactName contact={{ ...person, description: booking.contact?.via || undefined }} />
        </Fact>
      ) : null}
      {booking.value ? (
        <Fact label={labels.pinCard.value}>
          <PinnedValue booking={booking} className="text-sm font-medium" />
          <span className="ml-1 text-muted-foreground">{labels.pinCard.exclVat}</span>
        </Fact>
      ) : null}
    </dl>
  );
}
