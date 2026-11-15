import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { type BookingTone, bookingTintVariants } from "../booking-tone/booking-tone";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../card/card";
import { StatusBadge } from "../data-table/data-table-column-helpers";
import { type OrderViewFact, OrderViewFacts } from "./order-view-facts";
import { OrderViewMeta, type OrderViewMetaRow } from "./order-view-meta";

export type { OrderViewFact, OrderViewMetaRow };

export type OrderViewStatus = { name: string; color: string };

export type OrderViewProps = {
  /** The order's name, usually a link to its page. */
  title: ReactNode;
  /** A muted reference after the title, e.g. "#48". */
  reference?: ReactNode;
  /** A small line above the title, e.g. the date. */
  eyebrow?: ReactNode;
  /** A muted line under the title, e.g. guests and total. */
  subtitle?: ReactNode;
  /** The order's status; `null` hides the badge (no pipeline access). */
  status: OrderViewStatus | null;
  /** A prominent block under the header, e.g. what the booking is worth. */
  highlight?: ReactNode;
  /** Icon rows under the header, e.g. time and place. In `bare` the badge sits on the first row. */
  meta?: readonly OrderViewMetaRow[];
  facts?: readonly OrderViewFact[];
  /** Shown for a fact whose value is `null`, e.g. "–". */
  hidden?: string;
  /** Italic staff note between the rows and the facts. */
  notes?: ReactNode;
  /** Chips below the facts, e.g. clashes. */
  warnings?: ReactNode;
  footer?: ReactNode;
  /** Buttons on the right of the title row. */
  headerActions?: ReactNode;
  /** No card chrome, for popovers and trays that bring their own surface. */
  bare?: boolean;
  /**
   * In `bare`, the card's state as a subtle wash behind the header, edge to edge: the surface
   * must have `p-3.5` and clip its corners (`overflow-hidden`).
   */
  tone?: BookingTone | undefined;
  className?: string;
};

function Header({ title, reference, eyebrow, subtitle, bare }: OrderViewProps) {
  const heading = (
    <>
      <span>{title}</span>
      {reference ? (
        <span className="ml-1.5 font-normal text-muted-foreground tabular-nums">{reference}</span>
      ) : null}
    </>
  );
  return (
    <div className="min-w-0 flex-1">
      {eyebrow ? (
        <p className="mb-0.5 font-medium text-[11px] text-muted-foreground">{eyebrow}</p>
      ) : null}
      {bare ? (
        <div className="break-words font-semibold text-sm leading-snug">{heading}</div>
      ) : (
        <CardTitle className="text-base">{heading}</CardTitle>
      )}
      {subtitle ? (
        <p className="mt-0.5 break-words text-muted-foreground text-xs tabular-nums">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Body(props: OrderViewProps) {
  const { highlight, meta, facts, hidden = "–", notes, warnings } = props;
  return (
    <>
      {highlight}
      {meta?.length ? <OrderViewMeta rows={meta} status={null} /> : null}
      {notes ? (
        <p className="border-t border-border/60 pt-1.5 text-muted-foreground italic leading-relaxed">
          {notes}
        </p>
      ) : null}
      {facts?.length ? <OrderViewFacts facts={facts} hidden={hidden} /> : null}
      {warnings ? <div className="flex flex-wrap gap-1 pt-1">{warnings}</div> : null}
    </>
  );
}

const mix = ({ color, percent }: { color: string; percent: number }) =>
  `color-mix(in oklch, ${color} ${percent}%, transparent)`;

/** The status colour as a subtle wash behind a card's header, out to the card's edge. */
const statusHeader = ({ color }: { color: string }) => ({
  backgroundColor: mix({ color, percent: 16 }),
});

/**
 * The bare card: the header (washed in its status colour when it has a tone, else by the tone;
 * without a tone ruled off), then each part under one thin
 * rule, never two, and nothing under the last.
 */
function BareOrderView({ actions, ...props }: OrderViewProps & { actions: ReactNode }) {
  const { highlight, meta, facts, hidden = "–", notes, warnings, footer, tone, status } = props;
  return (
    <div data-slot="order-view" className={cn("grid text-xs", props.className)}>
      <div
        className={cn(
          "flex items-start justify-between gap-2",
          tone
            ? cn(
                "-mx-3.5 -mt-3.5 rounded-t-xl px-3.5 pt-3 pb-2.5",
                status?.color ? null : bookingTintVariants({ tone }),
              )
            : "border-b border-border/60 pb-2",
        )}
        style={tone && status?.color ? statusHeader({ color: status.color }) : undefined}
      >
        <Header {...props} />
        {actions}
      </div>
      <div className="grid divide-y divide-border/60 *:py-2 *:last:pb-0">
        {highlight}
        {meta?.length ? <OrderViewMeta rows={meta} status={status} /> : null}
        {notes ? <p className="text-muted-foreground italic leading-relaxed">{notes}</p> : null}
        {facts?.length ? <OrderViewFacts facts={facts} hidden={hidden} bare /> : null}
        {warnings ? <div className="flex flex-wrap gap-1">{warnings}</div> : null}
        {footer ? <div>{footer}</div> : null}
      </div>
    </div>
  );
}

/** One order at a glance (`order.view`): status, party, people, program totals and balance. */
export function OrderView(props: OrderViewProps) {
  const { footer, headerActions, bare, className, status, meta } = props;
  // In `bare` the badge sits on the first meta row, unless there is none.
  const badge =
    status && (!bare || !meta?.length) ? (
      <StatusBadge label={status.name} color={status.color} />
    ) : null;
  const actions =
    badge || headerActions ? (
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        {badge}
        {headerActions}
      </div>
    ) : null;

  if (bare) return <BareOrderView {...props} actions={actions} />;

  return (
    <Card data-slot="order-view" className={cn("shadow-none", className)}>
      <CardHeader className="flex-row items-start justify-between gap-2 p-4 pb-2">
        <Header {...props} />
        {actions}
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0">
        <Body {...props} />
      </CardContent>
      {footer ? <CardFooter className="p-4 pt-0 text-sm">{footer}</CardFooter> : null}
    </Card>
  );
}
