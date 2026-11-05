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
import { OrderView, type OrderViewFact, type OrderViewMetaRow } from "../order-view/order-view";
import { BookingStats, bookingFacts } from "./booking-extras";
import { cleanTitle } from "./clean-title";
import { PinAction, VisitAction } from "./hover-actions";
import { contactFacts } from "./hover-contacts";

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
  footer?: ReactNode;
  headerActions?: ReactNode;
  /** Adds the booking's own quantity, hold and buffers, e.g. in a pinned card. */
  detailed?: boolean;
  /** Facts after the booking's, e.g. the order's assignee and totals. */
  extraFacts?: readonly OrderViewFact[];
};

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
    // With labels the value is its own block (`BookingValue`), so only guests stay here.
    const amount =
      booking.value && !labels
        ? `${booking.value.currency} ${booking.value.amount.toFixed(2)}`
        : "";
    const value = amount ? `${amount} excl. VAT` : "";
    const facts = [guests, value].filter(Boolean).join(" · ");
    if (facts) return facts;
  }
  if (customer && customer !== displayTitle) {
    return customer;
  }
  return undefined;
}

const titleLinkClass =
  "text-left underline-offset-2 outline-none hover:underline focus-visible:underline";

type TitleLinkProps = {
  title: string;
  href?: string | undefined;
  onOpen?: (() => void) | undefined;
};

function TitleLink({ title, href, onOpen }: TitleLinkProps) {
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={titleLinkClass}>
        {title}
      </button>
    );
  }
  if (href) {
    return (
      <AppLink href={href} className={titleLinkClass}>
        {title}
      </AppLink>
    );
  }
  return <>{title}</>;
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

  const actions =
    props.headerActions ??
    (hasPin || hasVisit ? (
      <>
        {hasPin && pinBooking ? (
          <PinAction booking={pinBooking} name={customer ?? rawTitle} />
        ) : null}
        {hasVisit ? <VisitAction href={href} onOpen={onOpen} title={rawOrder ?? rawTitle} /> : null}
      </>
    ) : undefined);

  const facts: OrderViewFact[] = booking ? contactFacts({ booking, labels }) : [];
  if (props.detailed && booking && labels) facts.push(...bookingFacts({ booking, labels }));
  facts.push(...(props.extraFacts ?? []));

  // The detailed card shows time and place as stats instead.
  const meta: OrderViewMetaRow[] = [];
  const asRows = !(props.detailed && booking && labels);
  if (asRows && time) meta.push({ key: "time", icon: ClockIcon, text: time });
  if (asRows && resource) {
    const place = group ? `${resource} (${group})` : resource;
    meta.push({ key: "place", icon: MapPinIcon, text: place });
  }

  return (
    <OrderView
      bare
      eyebrow={dateStr}
      title={<TitleLink href={href} onOpen={onOpen} title={displayTitle} />}
      reference={orderRef}
      subtitle={sub}
      status={state ?? null}
      meta={meta}
      notes={notes}
      highlight={
        booking && labels ? (
          <BookingStats
            booking={booking}
            labels={labels}
            detailed={Boolean(props.detailed)}
            time={time}
            resource={resource}
          />
        ) : undefined
      }
      facts={facts}
      warnings={
        warnings?.length
          ? warnings.map((warning) => (
              <Badge key={warning} variant="warning" className="text-[10px]">
                <TriangleAlertIcon className="mr-1 size-3" />
                {warning}
              </Badge>
            ))
          : undefined
      }
      footer={footer}
      headerActions={actions}
    />
  );
}
