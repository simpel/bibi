"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Button } from "../button/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../sheet/sheet";
import { useCalendarLabels } from "./calendar-labels";
import type { CalendarOrder } from "./calendar-types";
import { OrderLanes } from "./order-lanes";

export type BookingSheetProps = {
  /** The booking's order; `null` closes the sheet. */
  order: CalendarOrder | null;
  locale: string;
  onClose: () => void;
  /** Leaves the calendar for the order itself. */
  onOpenOrder?: () => void;
  /** The order's lines with no time yet, e.g. a lunch still to be placed. */
  unscheduled?: readonly { id: string; name: string; quantity: number | null }[];
};

/** Lines not on the hour axis yet: a quiet list under the lanes, quantity first. */
function Unscheduled({ lines }: { lines: NonNullable<BookingSheetProps["unscheduled"]> }) {
  const labels = useCalendarLabels();
  if (lines.length === 0) return null;
  return (
    <section className="mt-4 grid gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{labels.unscheduled}</h3>
      <ul className="grid gap-1 text-sm">
        {lines.map((line) => (
          <li key={line.id} className="flex gap-2">
            <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">
              {line.quantity ?? ""}
            </span>
            <span className="min-w-0 truncate">{line.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Overview to detail: a booking's order, its lines that day on one hour axis, beside the
 * calendar. Closing returns to the same place; the booking stays ringed behind it.
 */
export function BookingSheet(props: BookingSheetProps) {
  const { order, locale, onClose, onOpenOrder, unscheduled = [] } = props;
  const labels = useCalendarLabels();
  return (
    <Sheet open={Boolean(order)} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-3xl"
        // Focus the sheet, not its first block: a focused block would pop its hover card.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle>{order?.reference}</SheetTitle>
          <SheetDescription>{order?.customer}</SheetDescription>
          {onOpenOrder && order ? (
            <Button size="sm" variant="outline" className="w-fit" onClick={onOpenOrder}>
              <SquareArrowOutUpRightIcon aria-hidden />
              {labels.open({ order: order.reference })}
            </Button>
          ) : null}
        </SheetHeader>
        <div className="px-4 pb-6">
          {order ? <OrderLanes order={order} audience="internal" locale={locale} /> : null}
          <Unscheduled lines={unscheduled} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
