export type DayGroup<T> = { key: string; rows: T[] };

export type DayGroupsInput<T> = {
  rows: readonly T[];
  /** The row's day in the organization's zone, e.g. its formatted date. */
  dayOf: (row: T) => string;
};

/** Rows (already in time order) split into consecutive days, in order. */
export function dayGroups<T>({ rows, dayOf }: DayGroupsInput<T>): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const row of rows) {
    const key = dayOf(row);
    const last = groups.at(-1);
    if (last && last.key === key) last.rows.push(row);
    else groups.push({ key, rows: [row] });
  }
  return groups;
}
