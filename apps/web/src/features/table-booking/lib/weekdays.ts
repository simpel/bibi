export type WeekdaysLabelInput = {
  /** 0 = Monday … 6 = Sunday. */
  days: readonly number[];
  /** The short names, Monday first. */
  names: readonly string[];
};

/** `Mon–Fri` for a run of three or more days, else the names in order (`Tue, Thu`). */
export function weekdaysLabel({ days, names }: WeekdaysLabelInput): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const name = ({ day }: { day: number | undefined }) => names[day ?? 0] ?? "";
  if (
    first !== undefined &&
    last !== undefined &&
    sorted.length >= 3 &&
    last - first + 1 === sorted.length
  )
    return `${name({ day: first })}–${name({ day: last })}`;
  return sorted.map((day) => name({ day })).join(", ");
}
