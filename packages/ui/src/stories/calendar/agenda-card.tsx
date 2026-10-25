import { cn } from "../../lib/cn";
import { CalendarHoverCard } from "./calendar-hover-card";
import { dotStyle } from "./calendar-marks";
import { LineContact, StaffList, ticketLines } from "./calendar-people";
import { durationLabel, toMinutes } from "./calendar-time";
import type { CalendarAudience, CalendarLine, CalendarTicket } from "./calendar-types";
import { DateLeaf } from "./date-leaf";
import { GuestMark } from "./guest-mark";

export type AgendaCardProps = {
  ticket: CalendarTicket;
  audience: CalendarAudience;
  locale?: string;
};

function meta({ line }: { line: CalendarLine }) {
  const minutes = toMinutes({ time: line.end }) - toMinutes({ time: line.start });
  return [`until ${line.end}`, durationLabel({ minutes }), line.place].filter(Boolean).join(" · ");
}

/** Internal only: who to call about this line, then who works it. Customers see no people. */
function People({ line, audience }: { line: CalendarLine; audience: CalendarAudience }) {
  if (audience === "external" || !line.contact) return null;
  return (
    <div className="mt-1.5 grid gap-1.5">
      <LineContact contact={line.contact} />
      <StaffList staff={line.staff} />
    </div>
  );
}

function AgendaRow({
  line,
  audience,
  last,
}: {
  line: CalendarLine;
  audience: CalendarAudience;
  last: boolean;
}) {
  return (
    <li className="grid grid-cols-[3rem_0.75rem_1fr] gap-x-3">
      <span className="pt-px text-right text-sm font-medium tabular-nums">{line.start}</span>
      <span className="relative flex justify-center">
        <span
          className="relative z-10 mt-1.5 size-2.5 rounded-full"
          style={dotStyle({ state: line.state, audience })}
        />
        {last ? null : <span className="absolute top-4 bottom-0 w-px bg-border" />}
      </span>
      <div className={cn("pb-4", last && "pb-0")}>
        <span className="flex items-center gap-2">
          <CalendarHoverCard line={line} audience={audience}>
            <button
              type="button"
              className="w-fit cursor-default text-left text-sm font-medium outline-none focus-visible:underline"
            >
              {line.name}
              {line.internalOnly ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">Internal</span>
              ) : null}
            </button>
          </CalendarHoverCard>
          {audience === "internal" && line.guests ? <GuestMark /> : null}
        </span>
        <p className="text-xs text-muted-foreground">{meta({ line })}</p>
        <People line={line} audience={audience} />
      </div>
    </li>
  );
}

type AgendaHeaderProps = AgendaCardProps & { frame?: CalendarLine; rows: CalendarLine[] };

function AgendaHeader({ ticket, audience, locale, frame, rows }: AgendaHeaderProps) {
  const first = rows[0]?.start ?? "";
  const last = rows.reduce((end, line) => (line.end > end ? line.end : end), "");
  return (
    <div className="flex items-center gap-4">
      <DateLeaf
        date={ticket.date}
        locale={locale}
        size={audience === "external" ? "md" : "sm"}
        withYear={audience === "external"}
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {frame?.name ?? ticket.reference}
        </p>
        <h3 className="truncate font-serif text-xl font-light text-black dark:text-white">
          {ticket.purpose}
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {frame?.start ?? first}–{frame?.end ?? last} · {ticket.headcount} guests
        </p>
      </div>
    </div>
  );
}

/** The day in order. Bundle parts are listed; the bundle itself names the day. */
export function AgendaCard({ ticket, audience, locale }: AgendaCardProps) {
  const lines = ticketLines({ ticket, audience });
  const frame = lines.find((line) => lines.some((other) => other.parentId === line.id));
  const rows = lines
    .filter((line) => line !== frame)
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div className="grid gap-5 rounded-xl border bg-card p-5 shadow-xs">
      <AgendaHeader ticket={ticket} audience={audience} locale={locale} frame={frame} rows={rows} />
      <ol>
        {rows.map((line, index) => (
          <AgendaRow
            key={line.id}
            line={line}
            audience={audience}
            last={index === rows.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
