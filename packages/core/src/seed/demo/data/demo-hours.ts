import type { HoursPattern } from "../../../hours/schema";

type Span = { startMinute: number; endMinute: number };

const open = ({ weekdays, startMinute, endMinute }: Span & { weekdays: readonly number[] }) =>
  weekdays.map((weekday) => ({
    weekday,
    startMinute,
    endMinute,
    breakStartMinute: null,
    breakEndMinute: null,
  }));

const CLOSED = { startMinute: null, endMinute: null, breakStartMinute: null, breakEndMinute: null };

/** Lindholmen: weekdays 07–22, Saturday 09–18, closed on Sunday and on Christmas Eve. */
export const lindholmenHours: HoursPattern = {
  days: [
    ...open({ weekdays: [0, 1, 2, 3, 4], startMinute: 420, endMinute: 1320 }),
    ...open({ weekdays: [5], startMinute: 540, endMinute: 1080 }),
  ],
  exceptions: [{ date: "2026-12-24", ...CLOSED, note: "Christmas Eve" }],
};

/** Saltholmen: every day 08–20, with a short day on New Year's Eve. */
export const saltholmenHours: HoursPattern = {
  days: open({ weekdays: [0, 1, 2, 3, 4, 5, 6], startMinute: 480, endMinute: 1200 }),
  exceptions: [
    {
      date: "2026-12-31",
      startMinute: 600,
      endMinute: 900,
      breakStartMinute: null,
      breakEndMinute: null,
      note: "New Year's Eve",
    },
  ],
};
