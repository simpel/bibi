import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";

export const daySnapshotBlockVariants = cva(
  "absolute inset-y-1 truncate rounded-sm px-1.5 text-xs leading-6",
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

export type DaySnapshotTone = "hard" | "soft" | "draft" | "clash";

/** One bar on a row, in minutes from the day's midnight (past 1440 is the next day). */
export type DaySnapshotBlock = {
  id: string;
  start: number;
  end: number;
  label: string;
  tone: DaySnapshotTone;
};

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

const share = ({ minute, startMinute, endMinute }: Span & { minute: number }) =>
  (Math.min(Math.max(minute, startMinute), endMinute) - startMinute) / (endMinute - startMinute);

function Bar({ block, ...span }: Span & { block: DaySnapshotBlock }) {
  const left = share({ minute: block.start, ...span });
  const width = Math.max(share({ minute: block.end, ...span }) - left, 0.01);
  return (
    <div
      data-slot="day-snapshot-block"
      title={block.label}
      className={daySnapshotBlockVariants({ tone: block.tone })}
      style={{ left: `${left * 100}%`, width: `${width * 100}%` }}
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
  return (
    <div className="relative h-5 text-xs text-muted-foreground">
      {hours
        .filter((_, index) => index % step === 0)
        .map((hour) => (
          <span
            key={hour}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: `${share({ minute: hour * 60, ...span }) * 100}%` }}
          >
            {hourLabel({ hour })}
          </span>
        ))}
    </div>
  );
}

/**
 * One day at a glance: an hour axis and a row per resource with its bookings as bars. Purely
 * presentational; the caller places the bars in minutes and names them.
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
    <div data-slot="day-snapshot" className={cn("grid gap-1 text-sm", className)} {...props}>
      <div className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2">
        <span />
        <Axis {...span} hourLabel={hourLabel} />
      </div>
      {rows.map((row) => (
        <div key={row.id} className="grid grid-cols-[minmax(0,8rem)_1fr] items-center gap-2">
          <span className="truncate text-muted-foreground" title={row.label}>
            {row.label}
          </span>
          <div className="relative h-8 rounded-md border bg-card">
            {row.blocks.map((block) => (
              <Bar key={block.id} block={block} {...span} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
