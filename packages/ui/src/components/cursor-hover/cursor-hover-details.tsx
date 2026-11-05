"use client";

import { ClockIcon, MapPinIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppLink } from "../app-link/app-link";
import {
  type CalendarLabels,
  useOptionalCalendarLabels,
} from "../availability-calendar/calendar-labels";
import { toMinutes } from "../availability-calendar/calendar-time";
import type {
  AssetBooking,
  CalendarAudience,
  CalendarLine,
} from "../availability-calendar/calendar-types";
import { type PinnedBooking, usePins } from "../availability-calendar/pins-context";
import { Badge } from "../badge/badge";
import { StatusBadge } from "../data-table/data-table-column-helpers";
import { cleanTitle } from "./clean-title";
import { PinAction, VisitAction } from "./hover-actions";
import { BookingContacts } from "./hover-contacts";

export type CalendarHoverDetailsProps = {
  /** Full AssetBooking when available (availability calendar, timeline). */
  booking?: AssetBooking;
  /** CalendarLine when available (agenda rows, calendar spans) */
  line?: CalendarLine;
  /** Audience perspective: internal (staff) or external (customer) */
  audience?: CalendarAudience;
  /** Explicit or fallback properties (used by day-snapshot or custom views) */
  id?: string;
  title?: string;
  date?: string;
  subtitle?: string;
  time?: string;
  resource?: string;
  group?: string;
  state?: { name: string; color: string };
  order?: string;
  orderId?: string;
  href?: string;
  customer?: string;
  onOpen?: () => void;
  notes?: string;
  warnings?: string[];
  contacts?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
};

export type CursorHoverDetailsProps = CalendarHoverDetailsProps;
export type BookingDetailsProps = CalendarHoverDetailsProps;

function formatDateHeader({ dateStr }: { dateStr?: string }): string | undefined {
  if (!dateStr) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0),
  );
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function deriveSubtitle({
  booking,
  customer,
  displayTitle,
  labels,
}: {
  booking?: AssetBooking;
  customer?: string | null;
  displayTitle: string;
  labels: CalendarLabels | null;
}): string | undefined {
  if (booking) {
    if (!booking.order) {
      return labels ? `${labels.blocked}, ${labels.notSold}` : "Blocked, not sold";
    }
    const guests = booking.headcount
      ? labels
        ? labels.guests({ count: booking.headcount })
        : `${booking.headcount} guests`
      : "";
    const amount = booking.value
      ? labels
        ? labels.money(booking.value)
        : `${booking.value.currency} ${booking.value.amount.toFixed(2)}`
      : "";
    const value = amount ? (labels ? labels.exclVat({ amount }) : `${amount} excl. VAT`) : "";
    const facts = [guests, value].filter(Boolean).join(" · ");
    if (facts) return facts;
  }
  if (customer && customer !== displayTitle) {
    return customer;
  }
  return undefined;
}

/**
 * Unified hover card details for all calendar items across availability and order snapshot views.
 */
export function CalendarHoverDetails(props: CalendarHoverDetailsProps) {
  const {
    booking,
    line,
    id = booking?.id ?? line?.id,
    notes = props.notes ?? booking?.notes ?? line?.notes,
    warnings,
    footer,
  } = props;

  const labels = useOptionalCalendarLabels();

  // Resource / place
  const resource =
    props.resource ?? booking?.assetName ?? booking?.place ?? line?.place ?? undefined;
  const group = props.group ?? (booking?.type || line?.type || undefined);

  // Title and reference
  const rawTitle = props.title ?? booking?.name ?? line?.name ?? booking?.customer ?? "";
  const displayTitle = cleanTitle({ title: rawTitle, resource });
  const rawOrder = props.order ?? booking?.reference ?? booking?.order;
  const orderRef = rawOrder ? (rawOrder.startsWith("#") ? rawOrder : `#${rawOrder}`) : null;

  // Header dates and times
  const dateStr = props.date ?? formatDateHeader({ dateStr: booking?.date });
  const time =
    props.time ??
    (booking?.start && booking?.end
      ? labels
        ? `${labels.clock({ minutes: toMinutes({ time: booking.start }) })}–${labels.clock({ minutes: toMinutes({ time: booking.end }) })}`
        : `${booking.start}–${booking.end}`
      : line?.start && line?.end
        ? labels
          ? `${labels.clock({ minutes: toMinutes({ time: line.start }) })}–${labels.clock({ minutes: toMinutes({ time: line.end }) })}`
          : `${line.start}–${line.end}`
        : undefined);

  // State badge
  const state = props.state ?? booking?.state ?? line?.state;

  // Customer & subtitle
  const customer = props.customer ?? booking?.customer ?? undefined;
  const sub = props.subtitle ?? deriveSubtitle({ booking, customer, displayTitle, labels });

  // Navigation
  const href = props.href ?? booking?.href ?? line?.href;
  const onOpen = props.onOpen;

  // Pin support
  const pinBooking: PinnedBooking | undefined =
    booking ??
    (id
      ? {
          id,
          name: rawTitle,
          type: group ?? "",
          place: resource ?? null,
          assetId: resource ?? id,
          assetName: resource,
          date: "",
          start: time?.split("–")[0]?.trim() ?? "",
          end: time?.split("–")[1]?.trim() ?? "",
          setupMinutes: 0,
          teardownMinutes: 0,
          state: state
            ? { name: state.name, color: state.color, ink: "#ffffff", hold: "hard" }
            : { name: "Booked", color: "#16a34a", ink: "#ffffff", hold: "hard" },
          quantity: 1,
          order: orderRef ?? null,
          orderId: props.orderId,
          customer: customer ?? null,
          href,
        }
      : undefined);

  const pins = usePins();
  const hasPin = Boolean(pins && pinBooking);
  const hasVisit = Boolean(onOpen || href);
  const hasActions = Boolean(props.headerActions || hasPin || hasVisit);
  const rightPad = props.headerActions ? "pr-24" : hasActions ? "pr-16" : "";

  const titleContent = (
    <>
      <span>{displayTitle}</span>
      {orderRef ? (
        <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">{orderRef}</span>
      ) : null}
    </>
  );

  return (
    <div className="grid gap-2 text-xs">
      {/* Header section with top-right action buttons */}
      <div className="relative min-h-[1.75rem]">
        <div className={rightPad}>
          {dateStr ? (
            <p className="text-[11px] font-medium text-muted-foreground mb-0.5">{dateStr}</p>
          ) : null}

          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-left font-semibold text-sm leading-snug text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline break-words"
            >
              {titleContent}
            </button>
          ) : href ? (
            <AppLink
              href={href}
              className="block text-left font-semibold text-sm leading-snug text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline break-words"
            >
              {titleContent}
            </AppLink>
          ) : (
            <h3 className="font-semibold text-sm leading-snug text-foreground break-words">
              {titleContent}
            </h3>
          )}

          {sub ? (
            <p className="text-xs text-muted-foreground tabular-nums mt-0.5 break-words">{sub}</p>
          ) : null}
        </div>

        {props.headerActions ? (
          <div className="absolute top-0 right-0 flex items-center gap-1">
            {props.headerActions}
          </div>
        ) : hasActions ? (
          <div className="absolute top-0 right-0 flex items-center gap-1">
            {hasPin && pinBooking ? (
              <PinAction booking={pinBooking} name={customer ?? rawTitle} />
            ) : null}
            {hasVisit ? (
              <VisitAction href={href} onOpen={onOpen} title={rawOrder ?? rawTitle} />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Time & State row */}
      {time || state ? (
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          {time ? (
            <div className="flex items-center gap-1.5 tabular-nums">
              <ClockIcon className="size-3.5 shrink-0 opacity-70" />
              <span>{time}</span>
            </div>
          ) : (
            <span />
          )}
          {state ? <StatusBadge label={state.name} color={state.color} /> : null}
        </div>
      ) : null}

      {/* Resource / Place row */}
      {resource ? (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0 opacity-70" />
          <span>
            {resource}
            {group ? <span className="opacity-75"> ({group})</span> : null}
          </span>
        </div>
      ) : null}

      {/* Staff Notes */}
      {notes ? (
        <p className="border-t border-border/60 pt-1.5 italic text-muted-foreground leading-relaxed">
          {notes}
        </p>
      ) : null}

      {/* Contacts */}
      {props.contacts ? (
        <div className="border-t border-border/60 pt-2">{props.contacts}</div>
      ) : booking ? (
        <BookingContacts booking={booking} labels={labels} />
      ) : null}

      {/* Warnings */}
      {warnings && warnings.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-1">
          {warnings.map((warning) => (
            <Badge key={warning} variant="warning" className="text-[10px]">
              <TriangleAlertIcon className="mr-1 size-3" />
              {warning}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* Footer */}
      {footer ? <div className="border-t border-border/60 pt-1.5">{footer}</div> : null}
    </div>
  );
}

// Aliases for unified consumption across all views
export const CursorHoverDetails = CalendarHoverDetails;
export const BookingDetails = CalendarHoverDetails;
export const CalendarItemHover = CalendarHoverDetails;
