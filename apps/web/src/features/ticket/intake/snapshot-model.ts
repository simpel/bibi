import type { CalendarBlockDto, PreviewLine } from "@bibi/core";
import type { DaySnapshotBlock, DaySnapshotRow } from "@bibi/ui";
import type { ItemLine } from "../../line/actions";
import type { DraftLine } from "./draft-line";

const MINUTE = 60_000;
const DAY_START = 8 * 60;
const DAY_END = 20 * 60;

export type SnapshotInput = {
  lines: DraftLine[];
  /** The draft's preview lines in the same order; null while none is ready. */
  planned: readonly PreviewLine[] | null;
  /** Other bookings of the items the lines use (`calendar.range` with `itemIds`). */
  blocks: readonly CalendarBlockDto[];
  /** The requested day's midnight in the organization's zone. */
  midnight: Date;
  /** Other bookings' timed lines of the lines' items without occupancy (`line.list`). */
  itemLines?: readonly ItemLine[];
  /** Names of the items that get a row; an item not named here gets none. */
  itemNames: ReadonlyMap<string, string>;
  /** "#41 Saab" for another booking. */
  blockLabel: (input: { block: CalendarBlockDto }) => string;
  /** "Other lines": the row for timed lines without a bookable resource (a buffet). */
  otherLabel: string;
};

export type Snapshot = {
  startMinute: number;
  endMinute: number;
  rows: DaySnapshotRow[];
  /** Pools short that day (POOL_SHORT), listed under the snapshot. */
  shortages: { name: string; needed: number; free: number }[];
};

type Placed = { line: DraftLine; start: number; end: number; clash: boolean };

const minutesOf = ({ at, midnight }: { at: Date; midnight: Date }) =>
  Math.round((at.getTime() - midnight.getTime()) / MINUTE);

/** The timed lines in minutes from the day's midnight, each marked when it clashes. */
function placeLines({ lines, planned, midnight }: SnapshotInput): Placed[] {
  return lines.flatMap((line, index) => {
    if (!line.startsAt || !line.endsAt) return [];
    const clash = planned?.[index]?.issues.some(({ kind }) => kind === "HARD_CLASH") ?? false;
    const start = minutesOf({ at: new Date(line.startsAt), midnight });
    return [{ line, start, end: minutesOf({ at: new Date(line.endsAt), midnight }), clash }];
  });
}

/** 08:00–20:00, wider in whole hours to cover every line (past midnight is the next day). */
function spanOf({ placed }: { placed: Placed[] }) {
  const starts = placed.map(({ start }) => start);
  const ends = placed.map(({ end }) => end);
  return {
    startMinute: Math.floor(Math.min(DAY_START, ...starts) / 60) * 60,
    endMinute: Math.ceil(Math.max(DAY_END, ...ends) / 60) * 60,
  };
}

const draftBar = ({ line, start, end, clash }: Placed): DaySnapshotBlock => ({
  ...{ id: `draft-${line.key}`, start, end, label: line.name },
  tone: clash ? "clash" : "draft",
});

type ItemRowInput = { input: SnapshotInput; placed: Placed[]; itemId: string; name: string };

/** One resource: other bookings (hard dark, soft light) under this ticket's lines (dashed). */
function itemRow({ input, placed, itemId, name }: ItemRowInput): DaySnapshotRow {
  const { midnight } = input;
  const others: DaySnapshotBlock[] = input.blocks
    .filter((block) => block.itemId === itemId && !block.allocated)
    .map((block) => ({
      id: block.id,
      start: minutesOf({ at: block.startsAt, midnight }),
      end: minutesOf({ at: block.endsAt, midnight }),
      label: input.blockLabel({ block }),
      tone: block.soft ? ("soft" as const) : ("hard" as const),
    }));
  const lines: DaySnapshotBlock[] = (input.itemLines ?? [])
    .filter((line) => line.itemId === itemId)
    .map((line) => ({
      ...{ id: `line-${line.id}`, label: line.name, tone: "hard" as const },
      start: minutesOf({ at: new Date(line.startsAt), midnight }),
      end: minutesOf({ at: new Date(line.endsAt), midnight }),
    }));
  const own = placed.filter(({ line }) => line.itemId === itemId).map(draftBar);
  return { id: itemId, label: name, blocks: [...others, ...lines, ...own] };
}

/**
 * The calendar snapshot of step 4 (spec "Calendar snapshot"): one row per item the timed lines
 * use, with that day's other bookings of it in gray (occupancy for bookable items, other lines
 * for the rest) under this ticket's lines; one "Other lines" row for free-text lines when there
 * are any; and the pools short that day.
 */
export function snapshotOf({ ...input }: SnapshotInput): Snapshot {
  const placed = placeLines(input);
  const itemIds = [...new Set(placed.flatMap(({ line }) => (line.itemId ? [line.itemId] : [])))];
  const rows = itemIds.flatMap((itemId) => {
    const name = input.itemNames.get(itemId);
    return name ? [itemRow({ input, placed, itemId, name })] : [];
  });
  const loose = placed.filter(({ line }) => !line.itemId || !input.itemNames.has(line.itemId));
  const other = { id: "other", label: input.otherLabel, blocks: loose.map(draftBar) };
  const shortages = input.lines.flatMap((line, index) =>
    (input.planned?.[index]?.issues ?? [])
      .filter(({ kind }) => kind === "POOL_SHORT")
      .map(({ needed, free }) => ({ name: line.name, needed: needed ?? 0, free: free ?? 0 })),
  );
  return { ...spanOf({ placed }), rows: loose.length > 0 ? [...rows, other] : rows, shortages };
}
