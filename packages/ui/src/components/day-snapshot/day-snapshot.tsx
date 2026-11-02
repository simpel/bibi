import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { type DaySnapshotBlock, type LanedBlock, laneBlocks } from "./day-snapshot-lanes";

export type { DaySnapshotBlock } from "./day-snapshot-lanes";

export const daySnapshotBlockVariants = cva(
  "absolute h-5 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap rounded-sm px-1 text-xs leading-5",
  {
    variants: {
      tone: {
        /** Another booking's hard hold. */
        hard: "bg-foreground/80 text-background",
        /** Another booking's soft hold. */
        soft: "bg-muted-foreground/25 text-foreground",
        /** This booking's draft line. */
        draft: "border border-dashed border-primary bg-primary/10 text-foreground",
        /** This booking's draft line where it clashes. */
        clash: "border border-dashed border-destructive bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "draft" },
  },
);

export type DaySnapshotTone = DaySnapshotBlock["tone"];

export type DaySnapshotRow = { id: string; label: string; blocks: DaySnapshotBlock[] };

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
  return (
    <div
      data-slot="day-snapshot-block"
      title={block.label}
      className={daySnapshotBlockVariants({ tone: block.tone })}
      style={{
        left: `${left * 100}%`,
        width: `${width * 100}%`,
        top: `${PAD + block.lane * LANE}rem`,
      }}
    >
      {block.label}
    </div>
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
      <span className="truncate pt-1 text-muted-foreground" title={row.label}>
        {row.label}
      </span>
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
 * overlap go on lanes of their own, and a label too long for its bar ends in an ellipsis (the
 * full text is its tooltip). Purely presentational: the caller places the bars and names them.
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
  return (
    <div
      data-slot="day-snapshot"
      className={cn("grid min-w-0 gap-1 text-sm", className)}
      {...props}
    >
      <div className={COLUMNS}>
        <span />
        <Axis {...span} hourLabel={hourLabel} />
      </div>
      {rows.map((row) => (
        <Row key={row.id} row={row} {...span} />
      ))}
    </div>
  );
}
