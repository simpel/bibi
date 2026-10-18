import type { OccupancyType } from "@okazi/core/schemas";
import { ticketRoute } from "@/lib/routes";
import type { CalendarBlock } from "./calendar-blocks";
import type { CalendarColumn, PlacedBlock } from "./calendar-layout";
import type { CalendarView } from "./calendar-params";
import { assignLanes } from "./lanes";
import type { CalendarData } from "./load-calendar";

/** What the client grid draws: plain strings and numbers only, labels already translated. */
export type GridBlock = {
  id: string;
  href: string | null;
  type: OccupancyType;
  label: string;
  time: string;
  offset: number;
  span: number;
  /** Day view: which of the row's lanes the block sits in (overlapping options). */
  lane: number;
};
export type GridCell = {
  key: string;
  blocks: GridBlock[];
  slot: { label: string; prompt: string };
};
export type GridRow = { id: string; name: string; lanes: number; cells: GridCell[] };
export type GridModel = {
  view: CalendarView;
  columns: { key: string; label: string }[];
  rows: GridRow[];
};

/** Translators the server component builds from next-intl; kept as functions so this stays pure. */
export type CalendarLabels = {
  type: (input: { type: OccupancyType }) => string;
  reference: (input: { reference: number }) => string;
  option: (input: { position: number }) => string;
  time: (input: { block: CalendarBlock }) => string;
  column: (input: { column: CalendarColumn }) => string;
  slot: (input: { space: string; column: CalendarColumn }) => { label: string; prompt: string };
};

type LabelInput = { block: CalendarBlock; labels: CalendarLabels };

/** "2nd option · Ticket 12 · Lunch"; a plain ticket shows its reference and program item. */
export function blockLabel({ block, labels }: LabelInput): string {
  const kind =
    block.queuePosition !== null
      ? labels.option({ position: block.queuePosition })
      : block.type === "BOOKING" && block.ticketId
        ? null
        : labels.type({ type: block.type });
  const reference =
    block.reference !== null ? labels.reference({ reference: block.reference }) : null;
  const parts = [kind, reference, block.title].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : labels.type({ type: block.type });
}

type ToGridBlockInput = { placed: PlacedBlock; lane: number; labels: CalendarLabels };

function toGridBlock({ placed, lane, labels }: ToGridBlockInput): GridBlock {
  const { block, offset, span } = placed;
  return {
    id: block.id,
    href: block.ticketId ? ticketRoute({ id: block.ticketId }) : null,
    type: block.type,
    label: blockLabel({ block, labels }),
    time: labels.time({ block }),
    offset,
    span,
    lane,
  };
}

export type BuildGridInput = {
  view: CalendarView;
  data: CalendarData;
  columns: CalendarColumn[];
  place: (input: { blocks: CalendarBlock[] }) => PlacedBlock[][];
  labels: CalendarLabels;
};

/** One row per space, one cell per column, each block in the cell where it starts. */
export function buildGridModel({ view, data, columns, place, labels }: BuildGridInput): GridModel {
  const rows = data.spaces.map((space) => {
    const blocks = data.blocks.filter(({ itemId }) => itemId === space.id);
    const placed = place({ blocks });
    const { lanes, count } = assignLanes({ blocks });
    const cells = columns.map((column, index) => ({
      key: column.start.toISOString(),
      blocks: (placed[index] ?? []).map((item) =>
        toGridBlock({ placed: item, lane: lanes.get(item.block.id) ?? 0, labels }),
      ),
      slot: labels.slot({ space: space.name, column }),
    }));
    return { id: space.id, name: space.name, lanes: count, cells };
  });
  const heads = columns.map((column) => ({
    key: column.start.toISOString(),
    label: labels.column({ column }),
  }));
  return { view, columns: heads, rows };
}
