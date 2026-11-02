import type { PreviewEntry, PreviewLine } from "@bibi/core";
import type { DraftLine, NewKey } from "./draft-line";

const iso = ({ date }: { date: Date | null }) => (date ? date.toISOString() : null);

type FromPreviewInput = { line: PreviewLine; newKey: NewKey };

/** A planned package line as an editable draft line: no overrides, choices or needs yet. */
function fromPreview({ line, newKey }: FromPreviewInput): DraftLine {
  return {
    key: newKey(),
    ...{ entityTypeId: line.entityTypeId, name: line.name },
    ...{ itemId: line.itemId, setupId: line.setupId },
    ...{ startsAt: iso({ date: line.startsAt }), endsAt: iso({ date: line.endsAt }) },
    quantity: line.quantity,
    ...{ unitPriceMinor: null, discountPercent: null, note: null },
    ...{ options: [], needs: [], addOns: [], fields: {} },
  };
}

export type LinesFromEntryInput = {
  entry: PreviewEntry;
  newKey: NewKey;
  /** "Keep <to> and shorten the lines in review": lines end here at the latest. */
  shortenTo?: Date | null;
};

/** A line that runs past `to` ends there; one that starts at or after it is left as it is. */
function shorten({ line, to }: { line: DraftLine; to: Date }): DraftLine {
  if (!line.startsAt || !line.endsAt) return line;
  const fits = new Date(line.endsAt) <= to || new Date(line.startsAt) >= to;
  return fits ? line : { ...line, endsAt: to.toISOString() };
}

/** The lines step 4 starts with for a package: its planned lines from the preview (ADR 0081). */
export function linesFromEntry({ entry, newKey, shortenTo }: LinesFromEntryInput): DraftLine[] {
  const lines = entry.lines.map((line) => fromPreview({ line, newKey }));
  return shortenTo ? lines.map((line) => shorten({ line, to: shortenTo })) : lines;
}

export type ShiftLinesInput = { lines: DraftLine[]; deltaMs: number };

/** Every timed line (and add-on with its own time) moved by the same amount; untimed stay. */
export function shiftLines({ lines, deltaMs }: ShiftLinesInput): DraftLine[] {
  const move = ({ at }: { at: string | null }) =>
    at === null ? null : new Date(new Date(at).getTime() + deltaMs).toISOString();
  const moved = <T extends { startsAt: string | null; endsAt: string | null }>({
    row,
  }: {
    row: T;
  }): T => ({
    ...row,
    startsAt: move({ at: row.startsAt }),
    endsAt: move({ at: row.endsAt }),
  });
  return lines.map((line) => ({
    ...moved({ row: line }),
    addOns: line.addOns.map((addOn) => moved({ row: addOn })),
  }));
}

/** How step 3's switching question was answered (spec "Switching"). */
export type SwitchChoice = "REPLACE" | "ADD" | "KEEP" | "EMPTY";

export type NextLinesInput = { current: DraftLine[]; incoming: DraftLine[]; choice: SwitchChoice };

/** The lines after a switch: replaced, added to, kept for editing, or none. */
export function nextLines({ current, incoming, choice }: NextLinesInput): DraftLine[] {
  if (choice === "REPLACE") return incoming;
  if (choice === "ADD") return [...current, ...incoming];
  if (choice === "KEEP") return current;
  return [];
}

export type UpsertLineInput = { lines: DraftLine[]; line: DraftLine };

/** The edited line in its place, or a new one at the end. */
export function upsertLine({ lines, line }: UpsertLineInput): DraftLine[] {
  const found = lines.some(({ key }) => key === line.key);
  return found ? lines.map((each) => (each.key === line.key ? line : each)) : [...lines, line];
}

/**
 * Without the line of `key` (its add-ons go with it, ADR 0088 decision 10), or without the add-on
 * whose row key (`<line key>:<add-on key>`) it is.
 */
export const removeLine = ({ lines, key }: { lines: DraftLine[]; key: string }) =>
  lines
    .filter((line) => line.key !== key)
    .map((line) => {
      const addOns = line.addOns.filter((addOn) => `${line.key}:${addOn.key}` !== key);
      return addOns.length === line.addOns.length ? line : { ...line, addOns };
    });
