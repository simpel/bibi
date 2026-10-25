import {
  addDays,
  fromZonedParts,
  type PlainDate,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";

/** One day's part of a span: its day key and local wall times, "24:00" at midnight. */
export type DaySegment = {
  date: string;
  start: string;
  end: string;
  first: boolean;
  last: boolean;
};

const MIDNIGHT = { hour: 0, minute: 0, second: 0 };

const clock = ({ hour, minute }: { hour: number; minute: number }) =>
  `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

const nextMidnight = ({ date, timeZone }: { date: PlainDate; timeZone: string }) =>
  fromZonedParts({ date: addDays({ date, days: 1 }), time: MIDNIGHT, timeZone });

export type DaySegmentsInput = { startsAt: Date; endsAt: Date; timeZone: string };

/**
 * A span cut at each midnight in `timeZone` (ADR 0064: days are keys of a zone, never stored),
 * so a line over midnight shows on both days.
 */
export function daySegments({ startsAt, endsAt, timeZone }: DaySegmentsInput): DaySegment[] {
  const segments: DaySegment[] = [];
  let from = startsAt;
  while (from < endsAt) {
    const parts = toZonedParts({ instant: from, timeZone });
    const midnight = nextMidnight({ date: parts.date, timeZone });
    const to = endsAt < midnight ? endsAt : midnight;
    segments.push({
      date: toIsoDate({ date: parts.date }),
      start: clock(parts.time),
      end: to === midnight ? "24:00" : clock(toZonedParts({ instant: to, timeZone }).time),
      first: segments.length === 0,
      last: to === endsAt,
    });
    from = to;
  }
  return segments;
}
