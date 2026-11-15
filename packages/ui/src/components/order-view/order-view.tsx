import { OctagonAlertIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Badge } from "../badge/badge";
import type { CardIssue } from "../booking-tone/booking-tone";
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
  /** What is wrong, as error or warning badges on their own row above the title. */
  issues?: readonly CardIssue[] | undefined;
  className?: string;
};

/** An issue in words: red with a stop sign when it blocks, amber with a triangle to fix. */
function IssueBadge({ issue }: { issue: CardIssue }) {
  const error = issue.level === "error";
  const Icon = error ? OctagonAlertIcon : TriangleAlertIcon;
  return (
    <Badge variant={error ? "destructive" : "warning"} className="gap-1">
      <Icon aria-hidden className="size-3" />
      {issue.label}
    </Badge>
  );
}

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

/** The bare card: the header ruled off, then each part under one thin rule, nothing under the last. */
function BareOrderView({
  actions,
  issueRow,
  ...props
}: OrderViewProps & { actions: ReactNode; issueRow: ReactNode }) {
  const { highlight, meta, facts, hidden = "–", notes, warnings, footer, status } = props;
  return (
    <div data-slot="order-view" className={cn("grid text-xs", props.className)}>
      {issueRow ? <div className="pb-2">{issueRow}</div> : null}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
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
  const { footer, headerActions, bare, className, status, meta, issues } = props;
  // In `bare` the badge sits on the first meta row, unless there is none.
  const badge =
    status && (!bare || !meta?.length) ? (
      <StatusBadge label={status.name} color={status.color} />
    ) : null;
  // Issues get their own row above the title, so the title row keeps its width.
  const issueRow = issues?.length ? (
    <div data-slot="order-view-issues" className="relative z-10 flex flex-wrap gap-1">
      {issues.map((issue) => (
        <IssueBadge key={issue.key} issue={issue} />
      ))}
    </div>
  ) : null;
  const actions =
    badge || headerActions ? (
      <div className="relative z-10 flex shrink-0 flex-wrap items-center justify-end gap-1">
        {badge}
        {headerActions}
      </div>
    ) : null;

  if (bare) return <BareOrderView {...props} actions={actions} issueRow={issueRow} />;

  return (
    <Card data-slot="order-view" className={cn("shadow-none", className)}>
      {issueRow ? <div className="px-4 pt-4">{issueRow}</div> : null}
      <CardHeader
        className={cn("flex-row items-start justify-between gap-2 p-4 pb-2", issueRow && "pt-2")}
      >
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
