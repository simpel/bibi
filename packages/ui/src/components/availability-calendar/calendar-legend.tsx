"use client";

import { LegendItem } from "../booking-tone/legend-item";
import { TASK_EDGE } from "../task-look/task-look";
import { useCalendarLabels } from "./calendar-labels";
import { bufferStyle, markStyle } from "./calendar-marks";
import type { CalendarState } from "./calendar-types";

/** An extra entry for what a user cannot guess: hard and soft holds and the blocked badge. */
export type CalendarLegendNote = {
  kind: "hard" | "soft" | "badge";
  name: string;
  text: string;
};

export type CalendarLegendProps = {
  /** The organization's states on screen. */
  states: readonly CalendarState[];
  withBuffers?: boolean;
  /** Show the grey "blocked, not sold" entry when manual blocks are on screen. */
  withBlocked?: CalendarState;
  /** Further entries, after the states; the app supplies the words. */
  notes?: readonly CalendarLegendNote[];
  /** The tasks entry, when tasks are on screen: an outlined, unfilled swatch. */
  withTasks?: { name: string; text?: string } | undefined;
};

const GREY = "var(--muted-foreground)";

/** A note's swatch, drawn with the calendar's own marks in neutral grey. */
function NoteSwatch({ kind }: { kind: CalendarLegendNote["kind"] }) {
  if (kind === "badge") return <span className="h-3 w-5 rounded-sm bg-destructive" />;
  const state = { name: "", color: GREY, ink: "var(--background)", hold: kind } as const;
  return (
    <span
      className="h-3 w-5 rounded-sm border"
      style={markStyle({ state, audience: "internal" })}
    />
  );
}

/** Internal only, and only what is on screen. Customers get no legend. */
export function CalendarLegend({
  states,
  withBuffers = true,
  withBlocked,
  notes = [],
  withTasks,
}: CalendarLegendProps) {
  const labels = useCalendarLabels();
  const swatch = "h-3 w-5 rounded-sm border";
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
      {states.map((state) => (
        <li key={state.name} className="flex items-center gap-2">
          <span className={swatch} style={markStyle({ state, audience: "internal" })} />
          <span className="font-medium text-foreground">{state.name}</span>
          {labels.holds[state.hold]}
        </li>
      ))}
      {withBlocked ? (
        <li className="flex items-center gap-2">
          <span
            className={swatch}
            style={markStyle({ state: withBlocked, audience: "internal" })}
          />
          <span className="font-medium text-foreground">{labels.blocked}</span>
          {labels.notSold}
        </li>
      ) : null}
      {withBuffers && states[0] ? (
        <li className="flex items-center gap-2">
          <span className="h-2 w-5 rounded-sm border" style={bufferStyle({ state: states[0] })} />
          <span className="font-medium text-foreground">{labels.buffers}</span>
          {labels.buffersText}
        </li>
      ) : null}
      {notes.map((note) => (
        <LegendItem key={note.kind} name={note.name} text={note.text}>
          <NoteSwatch kind={note.kind} />
        </LegendItem>
      ))}
      {withTasks ? (
        <LegendItem name={withTasks.name} text={withTasks.text}>
          <span className={`h-3 w-5 rounded-sm ${TASK_EDGE}`} />
        </LegendItem>
      ) : null}
    </ul>
  );
}
