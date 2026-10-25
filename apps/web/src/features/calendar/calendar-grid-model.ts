import type { CalendarBlockDto, OccupancyType } from "@bibi/core/schemas";
import { ticketRoute } from "@/lib/routes";
import type { CalendarColumn, GridView, PlacedBlock } from "./calendar-layout";
import { assignLanes } from "./lanes";
import type { CalendarData } from "./load-calendar";

/** What the client grid draws: plain strings and numbers only, labels already translated. */
export type GridBlock = {
  id: string;
  href: string | null;
  type: OccupancyType;
  /** A soft hold: drawn hatched, may overlap other soft holds (ADR 0044). */
  soft: boolean;
  /** The line's state color (hex), or null for blocks without a state. */
  color: string | null;
  label: string;
  time: string;
  offset: number;
  span: number;
  /** Day view: which of the row's lanes the block sits in (overlapping soft holds). */
  lane: number;
};
export type GridCell = {
  key: string;
  blocks: GridBlock[];
  slot: { label: string; prompt: string };
};
export type GridRow = { id: string; name: string; lanes: number; cells: GridCell[] };
export type GridModel = {
  view: GridView;
  columns: { key: string; label: string }[];
  rows: GridRow[];
};

/** Translators the server component builds from next-intl; kept as functions so this stays pure. */
export type CalendarLabels = {
  type: (input: { type: OccupancyType }) => string;
  reference: (input: { reference: number }) => string;
  heldSince: (input: { heldAt: Date }) => string;
  expires: (input: { expiresAt: Date }) => string;
  time: (input: { block: CalendarBlockDto }) => string;
  column: (input: { column: CalendarColumn }) => string;
  slot: (input: { space: string; column: CalendarColumn }) => { label: string; prompt: string };
};

type LabelInput = { block: CalendarBlockDto; labels: CalendarLabels };

/** "Prebooked · Held since 3 Oct · Expires 28 Feb · Ticket 12 · Lunch": the state is always text. */
export function blockLabel({ block, labels }: LabelInput): string {
  const kind = block.heldAt
    ? labels.heldSince({ heldAt: block.heldAt })
    : block.type === "HOLD" && block.ticketId
      ? null
      : labels.type({ type: block.type });
  const reference =
    block.reference !== null ? labels.reference({ reference: block.reference }) : null;
  const expires = block.expiresAt ? labels.expires({ expiresAt: block.expiresAt }) : null;
  const parts = [block.stateName, kind, expires, reference, block.title].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : labels.type({ type: block.type });
}

type ToGridBlockInput = { placed: PlacedBlock; lane: number; labels: CalendarLabels };

function toGridBlock({ placed, lane, labels }: ToGridBlockInput): GridBlock {
  const { block, offset, span } = placed;
  return {
    id: block.id,
    href: block.ticketId ? ticketRoute({ id: block.ticketId }) : null,
    type: block.type,
    soft: block.soft,
    color: block.stateColor,
    label: blockLabel({ block, labels }),
    time: labels.time({ block }),
    offset,
    span,
    lane,
  };
}

export type BuildGridInput = {
  view: GridView;
  data: CalendarData;
  columns: CalendarColumn[];
  place: (input: { blocks: CalendarBlockDto[] }) => PlacedBlock[][];
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
