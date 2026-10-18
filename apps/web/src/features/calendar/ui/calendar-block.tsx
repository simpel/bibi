import type { OccupancyType } from "@okazi/core/schemas";
import { Link } from "@okazi/i18n/navigation";
import { cn } from "@okazi/ui";
import type { GridBlock } from "../calendar-grid-model";
import { GRID_ITEM } from "./grid-keys";
import { stateStyle } from "./state-style";

/** Height of one lane in the day view, in rem; a row is as tall as its lanes. */
export const LANE_REM = 2.25;

const BASE =
  "block min-w-0 truncate rounded-md border px-2 py-1 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** One look per occupancy type; a hold is solid when hard (ADR 0044). */
const TYPE_CLASS: Record<OccupancyType, string> = {
  HOLD: "border-primary bg-primary text-primary-foreground hover:opacity-90",
  SETUP: "border-border bg-muted text-muted-foreground",
  MAINTENANCE: "border-warning bg-warning/20 text-foreground",
  INTERNAL: "border-border bg-secondary text-secondary-foreground",
};

/** Soft holds are dashed because they may overlap (ADR 0044). */
const SOFT_CLASS = "border-dashed border-primary bg-primary/10 text-foreground hover:bg-primary/20";

export type CalendarBlockViewProps = {
  block: GridBlock;
  row: number;
  col: number;
  first: boolean;
  /** Day view: placed inside its hour cell by offset and span; week view: stacked. */
  positioned: boolean;
};

/** A block: a link to its ticket, or plain text for a manual block without one. */
export function CalendarBlockView({ block, row, col, first, positioned }: CalendarBlockViewProps) {
  const text = [block.time, block.label].filter(Boolean).join(" · ");
  const look = block.color ? stateStyle({ color: block.color, soft: block.soft }) : undefined;
  const style = positioned
    ? {
        ...look,
        left: `${block.offset * 100}%`,
        width: `calc(${block.span * 100}% - 2px)`,
        top: `${block.lane * LANE_REM + 0.25}rem`,
        height: `${LANE_REM - 0.25}rem`,
      }
    : look;
  const className = cn(
    BASE,
    block.color ? "hover:opacity-90" : block.soft ? SOFT_CLASS : TYPE_CLASS[block.type],
    positioned ? "absolute z-10" : "relative z-10",
  );
  const focus = { [GRID_ITEM]: "", "data-row": row, "data-col": col, tabIndex: first ? 0 : -1 };
  if (!block.href) {
    return (
      <span className={className} style={style} title={text} {...focus}>
        <span className="font-medium">{block.label}</span> {block.time}
      </span>
    );
  }
  return (
    <Link href={block.href} className={className} style={style} title={text} {...focus}>
      <span className="font-medium">{block.label}</span> {block.time}
    </Link>
  );
}
