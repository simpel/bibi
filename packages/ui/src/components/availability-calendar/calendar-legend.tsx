"use client";

import { useCalendarLabels } from "./calendar-labels";
import { bufferStyle, markStyle } from "./calendar-marks";
import type { CalendarState } from "./calendar-types";

export type CalendarLegendProps = {
  /** The organization's states on screen. */
  states: readonly CalendarState[];
  withBuffers?: boolean;
  /** Show the grey "blocked, not sold" entry when manual blocks are on screen. */
  withBlocked?: CalendarState;
};

/** Internal only, and only what is on screen. Customers get no legend. */
export function CalendarLegend({ states, withBuffers = true, withBlocked }: CalendarLegendProps) {
  const labels = useCalendarLabels();
  const swatch = "h-3 w-5 rounded-sm border";
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
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
    </ul>
  );
}
