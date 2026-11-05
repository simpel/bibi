import { ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../collapsible/collapsible";
import { CursorHoverCard } from "../cursor-hover/cursor-hover-card";
import { CalendarHoverDetails } from "../cursor-hover/cursor-hover-details";
import { DaySnapshotLabel } from "./day-snapshot-label";
import { type DaySnapshotBlock, type LanedBlock, laneBlocks } from "./day-snapshot-lanes";
import { daySnapshotBlockVariants } from "./day-snapshot-variants";

export type { DaySnapshotBlock } from "./day-snapshot-lanes";

export type DaySnapshotTone = DaySnapshotBlock["tone"];

/** `href`: the resource's own page, which the label links to. */
export type DaySnapshotRow = {
  id: string;
  label: string;
  group?: string;
  href?: string;
  blocks: DaySnapshotBlock[];
};

export type DaySnapshotProps = ComponentProps<"div"> & {
  rows: DaySnapshotRow[];
  /** The window shown, in minutes from midnight; whole hours. */
  startMinute: number;
  endMinute: number;
  /** The axis label of an hour (24 and up are the next day, e.g. "01 +1"). */
  hourLabel: (input: { hour: number }) => string;
};

type Span = Pick<DaySnapshotProps, "startMinute" | "endMinute">;

/** A lane's height and the gap around it, in rem. */
const LANE = 1.5;
const PAD = 0.25;
/** A fixed label column; the hours take the rest of the width, so nothing scrolls sideways. */
const COLUMNS = "grid grid-cols-[7rem_minmax(0,1fr)] gap-2 sm:grid-cols-[9rem_minmax(0,1fr)]";

const share = ({ minute, startMinute, endMinute }: Span & { minute: number }) =>
  (Math.min(Math.max(minute, startMinute), endMinute) - startMinute) / (endMinute - startMinute);

function Bar({ block, ...span }: Span & { block: LanedBlock }) {
  const left = share({ minute: block.start, ...span });
  const width = Math.max(share({ minute: block.end, ...span }) - left, 0.005);
  const details = block.details ?? { title: block.label };
  const style = {
    left: `${left * 100}%`,
    width: `${width * 100}%`,
    top: `${PAD + block.lane * LANE}rem`,
  };
  const className = cn(
    daySnapshotBlockVariants({ tone: block.tone }),
    "cursor-pointer select-none no-underline hover:no-underline hover:opacity-90 transition-opacity",
  );

  const element = block.href ? (
    <AppLink href={block.href} data-slot="day-snapshot-block" className={className} style={style}>
      {block.label}
    </AppLink>
  ) : (
    <div data-slot="day-snapshot-block" className={className} style={style}>
      {block.label}
    </div>
  );

  return (
    <CursorHoverCard
      content={<CalendarHoverDetails id={block.id} href={block.href} {...details} />}
      asChild
    >
      {element}
    </CursorHoverCard>
  );
}

function Axis({ hourLabel, ...span }: Span & Pick<DaySnapshotProps, "hourLabel">) {
  const hours = Array.from(
    { length: (span.endMinute - span.startMinute) / 60 + 1 },
    (_, index) => span.startMinute / 60 + index,
  );
  const step = hours.length > 14 ? 2 : 1;
  const shown = hours.filter((_, index) => index % step === 0);
  // The edge labels stay inside the track instead of hanging over it.
  const align = ({ index }: { index: number }) =>
    index === 0 ? "" : index === shown.length - 1 ? "-translate-x-full" : "-translate-x-1/2";
  return (
    <div className="relative h-5 text-xs text-muted-foreground">
      {shown.map((hour, index) => (
        <span
          key={hour}
          className={cn("absolute tabular-nums", align({ index }))}
          style={{ left: `${share({ minute: hour * 60, ...span }) * 100}%` }}
        >
          {hourLabel({ hour })}
        </span>
      ))}
    </div>
  );
}

function Row({ row, ...span }: Span & { row: DaySnapshotRow }) {
  const { blocks, lanes } = laneBlocks({ blocks: row.blocks });
  return (
    <div className={cn(COLUMNS, "items-start")}>
      <DaySnapshotLabel label={row.label} href={row.href} />
      <div
        className="relative overflow-hidden rounded-md border bg-card"
        style={{ height: `${lanes * LANE + PAD * 2 - 0.25}rem` }}
      >
        {blocks.map((block) => (
          <Bar key={block.id} block={block} {...span} />
        ))}
      </div>
    </div>
  );
}

/**
 * One day at a glance: an hour axis and a row per resource with its bookings as bars; bars that
 * overlap go on lanes of their own, and a label too long for its bar ends in an ellipsis.
 * Hovering any bar shows its full details in a floating cursor hovercard. Rows can be grouped
 * into collapsible sections with chevrons.
 */
export function DaySnapshot({
  rows,
  startMinute,
  endMinute,
  hourLabel,
  className,
  ...props
}: DaySnapshotProps) {
  const span = { startMinute, endMinute };
  const hasGroups = rows.some((row) => Boolean(row.group));
  const groups = hasGroups ? [...new Set(rows.map((row) => row.group ?? ""))] : [];

  return (
    <div
      data-slot="day-snapshot"
      // Calendar UI always sits on the card surface (white), wherever it is placed.
      className={cn("grid min-w-0 gap-2 rounded-xl border bg-card p-3 text-sm sm:p-4", className)}
      {...props}
    >
      <div className={COLUMNS}>
        <span />
        <Axis {...span} hourLabel={hourLabel} />
      </div>
      {hasGroups
        ? groups.map((group) => {
            const members = rows.filter((r) => (r.group ?? "") === group);
            if (!group) {
              return members.map((row) => <Row key={row.id} row={row} {...span} />);
            }
            return (
              <Collapsible key={group} defaultOpen className="grid gap-1">
                <div className={COLUMNS}>
                  <CollapsibleTrigger className="group flex items-center gap-1.5 py-1 text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
                    <ChevronRightIcon className="size-3.5 transition-transform group-data-[state=open]:rotate-90" />
                    <span>{group}</span>
                    <span className="tabular-nums opacity-75">· {members.length}</span>
                  </CollapsibleTrigger>
                  <div />
                </div>
                <CollapsibleContent className="grid gap-1">
                  {members.map((row) => (
                    <Row key={row.id} row={row} {...span} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })
        : rows.map((row) => <Row key={row.id} row={row} {...span} />)}
    </div>
  );
}
