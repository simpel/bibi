"use client";

import { useState } from "react";
import { addDays, daysBetween, startOfMonth } from "./calendar-dates";
import type { CalendarWindow } from "./calendar-types";
import type { RangeChoice } from "./range-toolbar";
import {
  anchorOf,
  floorDayPx,
  levelDays,
  nearestLevel,
  type TimelineLevel,
} from "./timeline-scale";
import { shownDays } from "./timeline-view";
import type { Timeline } from "./use-timeline";

/** The same level one step earlier or later: a day, a week, or a calendar month. */
function stepFrom({
  level,
  date,
  direction,
}: {
  level: TimelineLevel;
  date: string;
  direction: -1 | 1;
}): string {
  const anchor = anchorOf({ level, date });
  if (level !== "month")
    return addDays({ date: anchor, days: direction * (level === "day" ? 1 : 7) });
  return startOfMonth({ date: addDays({ date: anchor, days: direction > 0 ? 32 : -1 }) });
}

type RangeInput = { timeline: Timeline; hours: CalendarWindow };

/** What is on screen, its middle day, and the level the zoom is nearest. */
function rangeState({ timeline, hours }: RangeInput) {
  const { view, trackPx } = timeline;
  const shown = shownDays(timeline);
  const centre = addDays({ date: shown.from, days: Math.floor(shown.count / 2) });
  const dayPx = view.dayPx || 1;
  const level = nearestLevel({ dayPx, trackPx: trackPx || 1, date: centre, hours });
  return { shown, centre, level };
}

/** The toolbar's state and actions on top of the timeline. */
export function useRangeControls({ timeline, hours, today }: RangeInput & { today: string }) {
  const [customPx, setCustomPx] = useState<number | null>(null);
  const { view, jump } = timeline;
  const { shown, centre, level } = rangeState({ timeline, hours });
  const choice: RangeChoice = customPx !== null && customPx === view.dayPx ? "custom" : level;
  return {
    choice,
    shown: { from: shown.from, to: addDays({ date: shown.from, days: shown.count - 1 }) },
    onLevel: (next: TimelineLevel) => {
      const date = anchorOf({ level: next, date: centre });
      jump({
        date,
        days: levelDays({ level: next, date }),
        floor: floorDayPx({ level: next, hours }),
      });
    },
    onStep: (direction: -1 | 1) => {
      const date =
        choice === "custom"
          ? addDays({ date: shown.from, days: direction * shown.count })
          : stepFrom({ level, date: centre, direction });
      jump({ date, days: shown.count, dayPx: view.dayPx });
    },
    onToday: () =>
      jump({ date: anchorOf({ level, date: today }), days: shown.count, dayPx: view.dayPx }),
    onCustom: ({ from, to }: { from: string; to: string }) =>
      setCustomPx(jump({ date: from, days: daysBetween({ from, to }) + 1 }).view.dayPx),
  };
}
