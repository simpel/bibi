import { toMinutes } from "../../components/availability-calendar/calendar-time";
import type { CalendarLine } from "../../components/availability-calendar/calendar-types";

/** Where the guests are from one time to the next: one stop per place, in order. */
export type GuestStop<Line extends CalendarLine = CalendarLine> = {
  line: Line;
  place: string;
  from: number;
  to: number;
};

const span = ({ line }: { line: CalendarLine }) => ({
  from: toMinutes({ time: line.start }),
  to: toMinutes({ time: line.end }),
});

/** Of the guest lines covering a stretch, the shortest is where they are: lunch beats the room. */
function hereAt<Line extends CalendarLine>({
  lines,
  from,
  to,
}: {
  lines: readonly Line[];
  from: number;
  to: number;
}): Line | undefined {
  const covering = lines.filter((line) => {
    const own = span({ line });
    return own.from <= from && own.to >= to;
  });
  const length = ({ line }: { line: Line }) => span({ line }).to - span({ line }).from;
  return covering.sort((a, b) => length({ line: a }) - length({ line: b }))[0];
}

/**
 * The guests' day as stops: at any moment they are in exactly one place. Stretches in the same
 * place merge, so a break in the room the guests already sit in is not a move.
 */
export function guestPath<Line extends CalendarLine>({
  lines,
  placeOf = (line) => line.place,
}: {
  lines: readonly Line[];
  /** What counts as one place; the venue grid uses the space. */
  placeOf?: (line: Line) => string | null;
}): GuestStop<Line>[] {
  const guestLines = lines.filter((line) => line.guests && placeOf(line));
  const cuts = [...new Set(guestLines.flatMap((line) => Object.values(span({ line }))))].sort(
    (a, b) => a - b,
  );
  const stops: GuestStop<Line>[] = [];
  cuts.slice(0, -1).forEach((from, index) => {
    const to = cuts[index + 1] ?? from;
    const line = hereAt({ lines: guestLines, from, to });
    const place = line ? placeOf(line) : null;
    if (!line || !place) return;
    const last = stops.at(-1);
    if (last && last.place === place && last.to === from) last.to = to;
    else stops.push({ line, place, from, to });
  });
  return stops;
}
