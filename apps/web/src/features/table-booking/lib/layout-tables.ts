import type { LayoutDto, TableCombinationDto } from "@bibi/core/schemas";

/** A seated piece of a layout as the tables editor shows it (strings are form values). */
export type TableRow = {
  id: string;
  label: string;
  seats: number;
  minCovers: string;
  maxCovers: string;
  onlineBookable: boolean;
};

export type CombinationRow = {
  /** A saved combination's id; none = new. */
  id: string;
  name: string;
  elementIds: string[];
  minCovers: string;
  maxCovers: string;
  onlineBookable: boolean;
};

/** One layout used by a sitting: its tables and combinations, ready for the editor. */
export type LayoutTables = {
  layoutId: string;
  name: string;
  tables: TableRow[];
  combinations: CombinationRow[];
};

const SEATED = new Set(["ROUND", "RECT"]);

const text = ({ value }: { value: number | null }) => (value === null ? "" : String(value));

/** The seated pieces (round and rectangular tables, not fixed) in label order. */
export function tablesOf({ layout }: { layout: LayoutDto }): TableRow[] {
  return layout.elements
    .filter((element) => SEATED.has(element.shape) && !element.fixed)
    .map((element) => ({
      id: element.id,
      label: element.label ?? "",
      seats: element.seatCount,
      minCovers: text({ value: element.minCovers }),
      maxCovers: text({ value: element.maxCovers }),
      onlineBookable: element.onlineBookable,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

export function combinationRows({
  items,
}: {
  items: readonly TableCombinationDto[];
}): CombinationRow[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    elementIds: [...item.elementIds],
    minCovers: text({ value: item.minCovers }),
    maxCovers: text({ value: item.maxCovers }),
    onlineBookable: item.onlineBookable,
  }));
}
