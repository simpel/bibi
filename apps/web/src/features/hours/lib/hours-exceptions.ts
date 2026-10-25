import type { HoursException } from "@bibi/core/schemas";
import { toMinute, toTime } from "./hours";

/** One dated exception in the editor; times as `HH:MM`, all empty when `closed`. */
export type ExceptionRow = {
  date: string;
  closed: boolean;
  start: string;
  end: string;
  breakStart: string;
  breakEnd: string;
  note: string;
};

const at = ({ minute }: { minute: number | null }) => (minute === null ? "" : toTime({ minute }));

/** A fresh exception: closed all day, the date still to pick. */
export const BLANK_EXCEPTION: ExceptionRow = {
  date: "",
  closed: true,
  start: "08:00",
  end: "17:00",
  breakStart: "",
  breakEnd: "",
  note: "",
};

/** The stored exceptions as editor rows; a closed day keeps 08–17 ready to switch to other hours. */
export function exceptionRowsFrom({
  exceptions,
}: {
  exceptions: readonly HoursException[];
}): ExceptionRow[] {
  return exceptions.map((exception) => {
    const closed = exception.startMinute === null || exception.endMinute === null;
    return {
      date: exception.date,
      closed,
      start: closed ? BLANK_EXCEPTION.start : at({ minute: exception.startMinute }),
      end: closed ? BLANK_EXCEPTION.end : at({ minute: exception.endMinute }),
      breakStart: at({ minute: exception.breakStartMinute }),
      breakEnd: at({ minute: exception.breakEndMinute }),
      note: exception.note ?? "",
    };
  });
}

/** The editor rows as `*.set` exceptions, sorted by date; the server validates the times. */
export function exceptionsFromRows({ rows }: { rows: readonly ExceptionRow[] }): HoursException[] {
  return rows
    .map((row) => ({
      date: row.date,
      startMinute: row.closed ? null : toMinute({ time: row.start }),
      endMinute: row.closed ? null : toMinute({ time: row.end }),
      breakStartMinute: row.closed ? null : toMinute({ time: row.breakStart }),
      breakEndMinute: row.closed ? null : toMinute({ time: row.breakEnd }),
      note: row.note.trim() === "" ? null : row.note.trim(),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
