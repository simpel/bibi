/** One table of the layout as assignment sees it (ADR 0119). */
export type TableUnit = {
  id: string;
  label: string | null;
  /** The most people: `maxCovers`, else its seats. */
  maxCovers: number;
  minCovers: number;
  onlineBookable: boolean;
};

/** Tables booked together for one party. */
export type CombinationUnit = {
  id: string;
  elementIds: readonly string[];
  maxCovers: number;
  minCovers: number;
  onlineBookable: boolean;
};

/** A hold on a table: who has it and of which kind. */
export type BusySpan = {
  startsAt: Date;
  endsAt: Date;
  kind: "RESERVATION" | "BLOCK" | "ONLINE_ONLY";
};

export type PickTablesInput = {
  tables: readonly TableUnit[];
  combinations: readonly CombinationUnit[];
  busy: ReadonlyMap<string, readonly BusySpan[]>;
  partySize: number;
  startsAt: Date;
  endsAt: Date;
  /** A guest booking: online-only tables and blocks are off limits. */
  online: boolean;
};

const overlaps = ({ span, startsAt, endsAt }: { span: BusySpan; startsAt: Date; endsAt: Date }) =>
  span.startsAt < endsAt && startsAt < span.endsAt;

/** Natural order of table labels ("2" before "10"), unlabelled last. */
const byLabel = ({ a, b }: { a: TableUnit; b: TableUnit }) =>
  (a.label ?? "￿").localeCompare(b.label ?? "￿", undefined, { numeric: true });

/**
 * The tables for a party (ADR 0119): the smallest single table that fits and is free for the
 * whole span, else the smallest free combination (fewest wasted seats, then fewest tables).
 * Staff may use online-only tables and book over an ONLINE_ONLY block; a guest may not. Null when
 * nothing fits.
 */
export function pickTables({
  tables,
  combinations,
  busy,
  partySize,
  startsAt,
  endsAt,
  online,
}: PickTablesInput): string[] | null {
  const byId = new Map(tables.map((table) => [table.id, table]));
  const free = ({ id }: { id: string }) => {
    const table = byId.get(id);
    if (!table || (online && !table.onlineBookable)) return false;
    return !(busy.get(id) ?? []).some(
      (span) => (online || span.kind !== "ONLINE_ONLY") && overlaps({ span, startsAt, endsAt }),
    );
  };
  const fits = ({ min, max }: { min: number; max: number }) => partySize >= min && partySize <= max;
  const single = tables
    .filter(
      (table) => fits({ min: table.minCovers, max: table.maxCovers }) && free({ id: table.id }),
    )
    .sort((a, b) => a.maxCovers - b.maxCovers || byLabel({ a, b }))[0];
  if (single) return [single.id];
  const joined = combinations
    .filter(
      (combination) =>
        (!online || combination.onlineBookable) &&
        fits({ min: combination.minCovers, max: combination.maxCovers }) &&
        combination.elementIds.every((id) => free({ id })),
    )
    .sort((a, b) => a.maxCovers - b.maxCovers || a.elementIds.length - b.elementIds.length)[0];
  return joined ? [...joined.elementIds] : null;
}
