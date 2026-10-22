import { windowsOf } from "../../features/line-allocation/line-windows";

const LINE_ROW_TYPES = ["HOLD", "SETUP", "TEARDOWN"] as const;
export type LineRowType = (typeof LINE_ROW_TYPES)[number];

export const isLineRowType = ({ type }: { type: string }): boolean =>
  (LINE_ROW_TYPES as readonly string[]).includes(type);

/** One line hold row: the line's own item, or an allocated unit (`allocationId`). */
export type HoldRow = {
  lineId: string;
  type: LineRowType;
  itemId: string;
  allocationId: string | null;
  holdKind: string | null;
  startsAt: Date;
  endsAt: Date;
};

const ROW_TYPE = { SETUP: "SETUP", BOOKING: "HOLD", TEARDOWN: "TEARDOWN" } as const;

/** An allocated unit and the windows its demand holds it for. */
export type HeldUnit = { allocationId: string; unitId: string; windows: readonly string[] };

export type RowsOfInput = {
  line: { lineId: string; itemId: string; holdKind: string; startsAt: Date; endsAt: Date };
  setup: number;
  teardown: number;
  units: readonly HeldUnit[];
};

/**
 * A held line's rows (ADR 0059): the hold and each buffer whose minutes are above zero, then
 * each allocated unit for the non-empty windows its demand names, all of the line's kind.
 */
export function rowsOf({ line, setup, teardown, units }: RowsOfInput): HoldRow[] {
  const { lineId, itemId, holdKind } = line;
  const windows = windowsOf({ startsAt: line.startsAt, endsAt: line.endsAt, setup, teardown });
  const own = windows.map(({ window, startsAt, endsAt }) => ({
    ...{ lineId, itemId, allocationId: null, holdKind, startsAt, endsAt },
    type: ROW_TYPE[window],
  }));
  const held = units
    .filter((unit) => unit.unitId !== itemId)
    .flatMap((unit) =>
      windows
        .filter(({ window }) => unit.windows.includes(window))
        .map(({ window, startsAt, endsAt }) => ({
          ...{ lineId, itemId: unit.unitId, allocationId: unit.allocationId },
          ...{ holdKind, startsAt, endsAt, type: ROW_TYPE[window] },
        })),
    );
  return [...own, ...held];
}
