import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
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
  const { highlight, meta, facts, hidden = "–", notes, warnings, bare, status } = props;
  const divided = bare ? "border-t border-border/60 pt-2" : "";
  return (
    <>
      {highlight}
      {meta?.length ? <OrderViewMeta rows={meta} status={bare ? status : null} /> : null}
      {notes ? (
        <p className="border-t border-border/60 pt-1.5 text-muted-foreground italic leading-relaxed">
          {notes}
        </p>
      ) : null}
      {facts?.length ? (
        <OrderViewFacts facts={facts} hidden={hidden} className={divided} bare={bare} />
      ) : null}
      {warnings ? <div className="flex flex-wrap gap-1 pt-1">{warnings}</div> : null}
    </>
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
      <div className="flex shrink-0 items-center gap-1">
        {badge}
        {headerActions}
      </div>
    ) : null;

  if (bare) {
    return (
      <div data-slot="order-view" className={cn("grid gap-2 text-xs", className)}>
        <div className="flex items-start justify-between gap-2">
          <Header {...props} />
          {actions}
        </div>
        <Body {...props} />
        {footer ? <div className="border-t border-border/60 pt-1.5">{footer}</div> : null}
      </div>
    );
  }

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
