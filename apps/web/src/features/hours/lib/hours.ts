import type { WorkingDay } from "@bibi/core/schemas";

/** One weekday in the hours editor; times as `HH:MM`, breaks empty when there is none. */
export type HoursRow = {
  weekday: number;
  works: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
};

const pad = ({ value }: { value: number }) => String(value).padStart(2, "0");

/** 480 → "08:00". */
export function toTime({ minute }: { minute: number }): string {
  return `${pad({ value: Math.floor(minute / 60) })}:${pad({ value: minute % 60 })}`;
}

/** "08:00" → 480; empty → null. */
export function toMinute({ time }: { time: string }): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

const at = ({ minute }: { minute: number | null | undefined }) =>
  minute == null ? "" : toTime({ minute });

/** Seven rows, Monday first; days without a working day are off with 08–17 to switch on. */
export function rowsFromDays({ days }: { days: readonly WorkingDay[] }): HoursRow[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
    const day = days.find((candidate) => candidate.weekday === weekday);
    return {
      weekday,
      works: Boolean(day),
      start: at({ minute: day?.startMinute ?? 480 }),
      end: at({ minute: day?.endMinute ?? 1020 }),
      breakStart: at({ minute: day ? day.breakStartMinute : 720 }),
      breakEnd: at({ minute: day ? day.breakEndMinute : 780 }),
    };
  });
}

/** The working rows as `workingHours.set` days; the server validates the times. */
export function daysFromRows({ rows }: { rows: readonly HoursRow[] }): WorkingDay[] {
  return rows
    .filter((row) => row.works)
    .map((row) => ({
      weekday: row.weekday,
      startMinute: toMinute({ time: row.start }) ?? 0,
      endMinute: toMinute({ time: row.end }) ?? 0,
      breakStartMinute: toMinute({ time: row.breakStart }),
      breakEndMinute: toMinute({ time: row.breakEnd }),
    }));
}

export type HoursGroup = { from: number; to: number; row: HoursRow };

const same = ({ a, b }: { a: HoursRow; b: HoursRow }) =>
  a.works === b.works &&
  (!a.works ||
    (a.start === b.start &&
      a.end === b.end &&
      a.breakStart === b.breakStart &&
      a.breakEnd === b.breakEnd));

/** Consecutive weekdays with the same hours, for the one-line summary ("Mon–Fri 08–17"). */
export function groupRows({ rows }: { rows: readonly HoursRow[] }): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last && same({ a: last.row, b: row })) last.to = row.weekday;
    else groups.push({ from: row.weekday, to: row.weekday, row });
  }
  return groups;
}
