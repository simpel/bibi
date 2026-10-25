import { ticketLines } from "../../components/availability-calendar/calendar-people";
import { CalendarSpan } from "../../components/availability-calendar/calendar-span";
import { axisWindow } from "../../components/availability-calendar/calendar-time";
import type {
  CalendarAudience,
  CalendarLine,
  CalendarTicket,
  CalendarWindow,
} from "../../components/availability-calendar/calendar-types";
import { DateLeaf } from "../../components/availability-calendar/date-leaf";
import { FrameBand } from "../../components/availability-calendar/frame-bracket";
import { GuestRail } from "../../components/availability-calendar/guest-lane";
import { GuestMark } from "../../components/availability-calendar/guest-mark";
import { type GuestStop, guestPath } from "../../components/availability-calendar/guest-path";
import { HOUR_REM, HourGutter, HourRules } from "../../components/availability-calendar/time-axis";

export type DayColumnProps = {
  ticket: CalendarTicket;
  audience: CalendarAudience;
  locale?: string;
};

type ColumnProps = {
  lines: CalendarLine[];
  audience: CalendarAudience;
  window: CalendarWindow;
  stops: readonly GuestStop[];
};

/** One item type's blocks, with the guest rail beside it while the guests are at its lines. */
function Column({ lines, audience, window, stops }: ColumnProps) {
  const here = stops.filter((stop) => lines.includes(stop.line));
  return (
    <div className="relative">
      <GuestRail stops={here} window={window} className="-left-1.5" />
      {lines.map((line) => (
        <CalendarSpan
          key={line.id}
          line={line}
          audience={audience}
          window={window}
          axis="y"
          bookingClassName="inset-x-1 px-2 py-1"
          bufferClassName="inset-x-3 rounded-sm"
        >
          {(size) => <DayBlock line={line} size={size} />}
        </CalendarSpan>
      ))}
    </div>
  );
}

type DayBlockProps = { line: CalendarLine; size: number };

/** Name, then time once the block is tall enough. Everything else is in the hover card. */
function DayBlock({ line, size }: DayBlockProps) {
  return (
    <>
      <span className="flex items-center gap-1">
        <span className="truncate font-medium">{line.name}</span>
        {line.guests ? <GuestMark /> : null}
      </span>
      {size > 5 ? (
        <span className="block tabular-nums opacity-80">
          {line.start}–{line.end}
        </span>
      ) : null}
    </>
  );
}

/** One ticket's day, hour by hour, one column per item type. For phones and run sheets. */
export function DayColumn({ ticket, audience, locale }: DayColumnProps) {
  const lines = ticketLines({ ticket, audience });
  const frame = lines.find((line) => lines.some((other) => other.parentId === line.id));
  const parts = lines.filter((line) => line !== frame);
  const window = axisWindow({ lines: parts, audience });
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="mb-5 flex items-center gap-3">
        <DateLeaf date={ticket.date} locale={locale} />
        <h3 className="font-serif text-xl font-light text-black dark:text-white">
          {ticket.purpose}
        </h3>
      </div>
      <DayBody frame={frame} parts={parts} audience={audience} window={window} />
    </div>
  );
}

type DayBodyProps = {
  frame?: CalendarLine;
  parts: CalendarLine[];
  audience: CalendarAudience;
  window: CalendarWindow;
};

function DayBody({ frame, parts, audience, window }: DayBodyProps) {
  const types = [...new Set(parts.map((line) => line.type))];
  const grid = { gridTemplateColumns: `repeat(${types.length}, minmax(0, 1fr))` };
  const stops = guestPath({ lines: parts });
  return (
    <div className="grid grid-cols-[3.5rem_1fr]">
      <span />
      <div className="grid gap-2 pb-3 pl-2" style={grid}>
        {types.map((type) => (
          <span key={type} className="px-1 text-xs font-medium text-muted-foreground">
            {type}
          </span>
        ))}
      </div>
      <HourGutter window={window} />
      <div
        className="relative"
        style={{ height: `${((window.to - window.from) / 60) * HOUR_REM}rem` }}
      >
        <HourRules window={window} axis="y" />
        {frame ? <FrameBand line={frame} window={window} /> : null}
        <div className="absolute inset-y-0 right-0 left-2 grid gap-2" style={grid}>
          {types.map((type) => (
            <Column
              key={type}
              lines={parts.filter((line) => line.type === type)}
              audience={audience}
              window={window}
              stops={stops}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
