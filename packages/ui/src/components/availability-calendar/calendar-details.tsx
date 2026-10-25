"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import { Button } from "../button/button";
import { useCalendarLabels } from "./calendar-labels";
import { LineContact } from "./calendar-people";
import type { CalendarAudience, CalendarLine } from "./calendar-types";

/** Staff notes: the one place free text about a line shows on a calendar. */
function Notes({ notes }: { notes: string }) {
  const labels = useCalendarLabels();
  return (
    <div className="grid gap-0.5 text-xs">
      <span className="text-muted-foreground">{labels.notes}</span>
      <p className="leading-relaxed">{notes}</p>
    </div>
  );
}

/** The card's one action, beside the title: everything else about the line is one click away. */
function OpenLine({ href }: { href: string }) {
  const labels = useCalendarLabels();
  return (
    <Button asChild size="sm" className="-my-1 shrink-0">
      <a href={href}>
        <SquareArrowOutUpRightIcon aria-hidden />
        {labels.openLine}
      </a>
    </Button>
  );
}

export type CalendarDetailsProps = { line: CalendarLine; audience: CalendarAudience };

/**
 * One calendar item for staff: its title with Open line, the notes, then who to call. State,
 * time, buffers, guests and staff are already drawn. Customers get the title and the time.
 */
export function CalendarDetails({ line, audience }: CalendarDetailsProps) {
  if (audience === "external") {
    return (
      <div className="grid gap-0.5">
        <p className="font-medium">{line.name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {line.start}–{line.end}
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{line.name}</p>
        {line.href ? <OpenLine href={line.href} /> : null}
      </div>
      {line.notes ? <Notes notes={line.notes} /> : null}
      {line.contact ? (
        <div className="border-t pt-2.5">
          <LineContact contact={line.contact} why={false} />
        </div>
      ) : null}
    </div>
  );
}
