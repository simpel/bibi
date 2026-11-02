import type { DateTimeFormat, PreviewAddOn, PreviewLine } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import type { CatalogItem } from "./catalog";
import type { DraftAddOn, DraftLine } from "./draft-line";
import { type LineDetails, lineDetails } from "./line-details";

/** One row of the lines table: a line, or one of its add-ons nested under it (ADR 0088). */
export type DraftLineRow = {
  key: string;
  /** The line, or the add-on's line (Edit opens its dialog). */
  line: DraftLine;
  addOn: DraftAddOn | null;
  name: string;
  /** Its own quantity; null follows `follows`. */
  quantity: number | null;
  /** What a null quantity counts: the guests for a line, the line's quantity for an add-on. */
  follows: number;
  startsAt: string | null;
  endsAt: string | null;
  /** The time as written, empty when untimed. */
  time: string;
  planned: PreviewAddOn | null;
  /** The line's second row; an add-on shows none. */
  details: LineDetails | null;
};

export type ReviewRowsInput = {
  lines: readonly DraftLine[];
  /** The preview's lines in the same order; null while none is ready. */
  planned: readonly PreviewLine[] | null;
  headcount: number;
  items: readonly CatalogItem[];
  needValues: readonly NamedOption[];
  /** "09:00–12:00" for a period. */
  timeRange: DateTimeFormat["timeRange"];
};

type Timed = { startsAt: string | null; endsAt: string | null };

const timeOf = ({ row, timeRange }: { row: Timed } & Pick<ReviewRowsInput, "timeRange">) =>
  row.startsAt && row.endsAt
    ? timeRange({ start: new Date(row.startsAt), end: new Date(row.endsAt) })
    : "";

type AddOnRowInput = { line: DraftLine; addOn: DraftAddOn; planned: PreviewAddOn | null };

/** An add-on's row: its own time and quantity, else its line's. */
function addOnRow({ line, addOn, planned, follows }: AddOnRowInput & { follows: number }) {
  const own = addOn.startsAt !== null && addOn.endsAt !== null;
  return {
    ...{ key: `${line.key}:${addOn.key}`, line, addOn, name: addOn.name },
    ...{ quantity: addOn.quantity, follows, planned, details: null },
    startsAt: own ? addOn.startsAt : line.startsAt,
    endsAt: own ? addOn.endsAt : line.endsAt,
  };
}

/** Every line followed by its add-ons, each with its planned row from the preview. */
export function reviewRows({ timeRange, ...input }: ReviewRowsInput): DraftLineRow[] {
  return rowsOf(input).map((row) => ({ ...row, time: timeOf({ row, timeRange }) }));
}

function rowsOf({ lines, planned, headcount, ...catalog }: Omit<ReviewRowsInput, "timeRange">) {
  return lines.flatMap((line, index): Omit<DraftLineRow, "time">[] => {
    const own = planned?.[index] ?? null;
    const lineQuantity = line.quantity ?? headcount;
    return [
      {
        ...{ key: line.key, line, addOn: null, name: line.name, planned: own },
        ...{ quantity: line.quantity, follows: headcount },
        ...{ startsAt: line.startsAt, endsAt: line.endsAt },
        details: lineDetails({ line, items: catalog.items, needValues: catalog.needValues }),
      },
      ...line.addOns.map((addOn, at) =>
        addOnRow({ line, addOn, planned: own?.addOns[at] ?? null, follows: lineQuantity }),
      ),
    ];
  });
}
