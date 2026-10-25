"use client";

import { cn } from "../../lib/cn";
import { type CalendarLabels, useCalendarLabels } from "./calendar-labels";
import { ticketLines } from "./calendar-people";
import { CalendarSpan } from "./calendar-span";
import { axisWindow } from "./calendar-time";
import type {
  CalendarAudience,
  CalendarLine,
  CalendarTicket,
  CalendarWindow,
} from "./calendar-types";
import { DateLeaf } from "./date-leaf";
import { FrameBracket } from "./frame-bracket";
import { GuestLane } from "./guest-lane";
import { GuestMark } from "./guest-mark";
import { guestPath } from "./guest-path";
import { HourLabels, HourRules } from "./time-axis";

export type TicketLanesProps = {
  ticket: CalendarTicket;
  audience: CalendarAudience;
  locale?: string;
};

/** Name and what/where: two lines beside the track, one line above it on narrow screens. */
function LaneLabel({ line }: { line: CalendarLine }) {
  const sub = [line.type, line.place].filter(Boolean).join(" · ");
  return (
    <div
      className={cn(
        "flex min-w-0 items-baseline gap-2 pt-2 pr-4 @2xl:block @2xl:py-2.5",
        line.parentId && "border-l-2 border-border pl-3",
      )}
    >
      <p className="flex min-w-0 items-center gap-1.5">
        <span className={cn("truncate text-sm", !line.parentId && "font-medium")}>{line.name}</span>
        {line.guests ? <GuestMark /> : null}
      </p>
      <p className="truncate text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

type LaneProps = {
  line: CalendarLine;
  audience: CalendarAudience;
  window: CalendarWindow;
  /** A package: its parts carry the times, so it draws as a bracket. */
  frame: boolean;
};

function Lane({ line, audience, window, frame }: LaneProps) {
  return (
    <div className="grid grid-cols-1 items-stretch border-t @2xl:grid-cols-[12rem_1fr]">
      <LaneLabel line={line} />
      <div className="relative h-11 @2xl:h-auto @2xl:min-h-12">
        <HourRules window={window} />
        {frame ? <FrameBracket line={line} window={window} /> : null}
        {frame ? null : (
          <CalendarSpan
            line={line}
            audience={audience}
            window={window}
            axis="x"
            bookingClassName="top-1/2 h-8 -translate-y-1/2"
            bufferClassName="top-1/2 h-5 -translate-y-1/2"
          >
            {() => (
              // Sized by the bar's own width, so a short bar drops the end, then the start.
              <span className="@container block size-full">
                <span className="flex h-full items-center px-2 font-medium whitespace-nowrap tabular-nums">
                  <span className="hidden @min-[2.75rem]:inline">{line.start}</span>
                  <span className="hidden @min-[6.5rem]:inline">–{line.end}</span>
                </span>
              </span>
            )}
          </CalendarSpan>
        )}
      </div>
    </div>
  );
}

type SummaryInput = { ticket: CalendarTicket; lines: number; labels: CalendarLabels };

function summary({ ticket, lines, labels }: SummaryInput) {
  const guests = ticket.headcount ? labels.guests({ count: ticket.headcount }) : "";
  return [ticket.reference, labels.lineCount({ count: lines }), guests].filter(Boolean).join(" · ");
}

/** Every line of one ticket on its own lane against one hour axis; buffers attach internally. */
export function TicketLanes({ ticket, audience, locale }: TicketLanesProps) {
  const lines = ticketLines({ ticket, audience });
  const window = axisWindow({ lines, audience });
  const labels = useCalendarLabels();
  return (
    <div className="@container rounded-xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <DateLeaf date={ticket.date} locale={locale} />
        <div>
          <h3 className="font-serif text-xl font-light text-black dark:text-white">
            {ticket.purpose}
          </h3>
          <p className="text-xs text-muted-foreground">
            {summary({ ticket, lines: lines.length, labels })}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 @2xl:grid-cols-[12rem_1fr]">
        <span className="hidden @2xl:block" />
        <HourLabels window={window} />
      </div>
      <div className="border-b">
        <GuestLane stops={guestPath({ lines })} headcount={ticket.headcount} window={window} />
        {lines.map((line) => (
          <Lane
            key={line.id}
            line={line}
            audience={audience}
            window={window}
            frame={lines.some((other) => other.parentId === line.id)}
          />
        ))}
      </div>
    </div>
  );
}
