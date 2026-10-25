import type { FormatDate } from "./calendar-dates";
import type { CalendarWindow } from "./calendar-types";
import { detailOf, pitchOf, type TimelineFrame } from "./timeline-scale";
import { drawnDays } from "./timeline-view";
import type { Timeline } from "./use-timeline";

/** Everything rows and the header need from the timeline's state to place their days. */
export function frameOf({
  timeline,
  hours,
  today,
  locale,
  formatDate,
  onDrill,
}: {
  timeline: Pick<Timeline, "view" | "scroll" | "trackPx">;
  hours: CalendarWindow;
  today: string;
  locale: string;
  formatDate: FormatDate;
  onDrill: (input: { date: string }) => void;
}): TimelineFrame {
  const { view, scroll, trackPx } = timeline;
  const pitch = pitchOf({ dayPx: view.dayPx });
  return {
    start: view.start,
    drawn: view.dayPx > 0 ? drawnDays({ view, scroll, trackPx }) : [],
    dayPx: view.dayPx,
    pitch,
    width: view.count * pitch,
    detail: detailOf({ dayPx: view.dayPx, hours }),
    hours,
    today,
    locale,
    formatDate,
    onDrill,
  };
}
