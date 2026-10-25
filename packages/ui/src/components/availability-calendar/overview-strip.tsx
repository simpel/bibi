"use client";

import type { KeyboardEvent, PointerEvent } from "react";
import { cn } from "../../lib/cn";
import { addDays, formatDate } from "./calendar-dates";
import { useCalendarLabels } from "./calendar-labels";
import { pitchOf } from "./timeline-scale";
import type { TimelineView } from "./timeline-view";

export type OverviewStripProps = {
  view: TimelineView;
  scroll: number;
  trackPx: number;
  /** How full each loaded day is across the assets shown, 0–1, by day key. */
  density: ReadonlyMap<string, number>;
  today: string;
  locale: string;
  /** What the strip says is on screen, for screen readers. */
  shownLabel: string;
  onScrollTo: (scroll: number) => void;
};

/** Where on the strip the pointer is, as a track scroll that centres that moment. */
function scrollAt({
  event,
  total,
  trackPx,
}: {
  event: PointerEvent;
  total: number;
  trackPx: number;
}) {
  const rect = event.currentTarget.getBoundingClientRect();
  return ((event.clientX - rect.left) / rect.width) * total - trackPx / 2;
}

function DayBar({
  index,
  date,
  share,
  view,
  locale,
  today,
}: {
  index: number;
  date: string;
  share: number;
  view: TimelineView;
  locale: string;
  today: string;
}) {
  const first = date.endsWith("-01");
  return (
    <span
      className={cn("absolute inset-y-0", first && "border-l border-muted-foreground/40")}
      style={{ left: `${(index / view.count) * 100}%`, width: `${100 / view.count}%` }}
    >
      {first ? (
        <span className="absolute top-0 left-0.5 text-[0.5625rem] leading-none text-muted-foreground">
          {formatDate({ date, locale, options: { month: "short" } })}
        </span>
      ) : null}
      <span
        className={cn(
          "absolute inset-x-px bottom-0",
          date === today ? "bg-primary" : "bg-muted-foreground/45",
        )}
        style={{ height: `${Math.max(share, 0.04) * 70}%` }}
      />
    </span>
  );
}

/** A slider over the loaded track: pointer drag, tap and arrow keys all scroll the timeline. */
function sliderProps({
  scroll,
  trackPx,
  total,
  onScrollTo,
}: {
  scroll: number;
  trackPx: number;
  total: number;
  onScrollTo: (scroll: number) => void;
}) {
  return {
    onPointerDown: (event: PointerEvent) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      onScrollTo(scrollAt({ event, total, trackPx }));
    },
    onPointerMove: (event: PointerEvent) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        onScrollTo(scrollAt({ event, total, trackPx }));
      }
    },
    onKeyDown: (event: KeyboardEvent) => {
      const step = { ArrowLeft: -trackPx / 2, ArrowRight: trackPx / 2 }[event.key];
      if (step !== undefined) onScrollTo(scroll + step);
    },
  } as const;
}

/**
 * Every loaded day as a bar of how booked it is, with a box for what is on screen. Drag or tap to
 * jump; the strip grows as more days load. Big enough to hit with a thumb on a phone.
 */
export function OverviewStrip({ view, scroll, trackPx, ...props }: OverviewStripProps) {
  const labels = useCalendarLabels();
  const total = view.count * pitchOf({ dayPx: view.dayPx });
  if (total === 0) return null;
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(scroll)}
      {...sliderProps({ scroll, trackPx, total, onScrollTo: props.onScrollTo })}
      aria-label={labels.jumpInTime}
      aria-valuetext={props.shownLabel}
      className="relative h-8 touch-none cursor-pointer overflow-hidden bg-muted outline-none select-none focus-visible:ring-2 focus-visible:ring-ring sm:h-7"
    >
      {Array.from({ length: view.count }, (_, index) => {
        const date = addDays({ date: view.start, days: index });
        const share = props.density.get(date) ?? 0;
        return (
          <DayBar
            key={date}
            {...{ index, date, share, view }}
            locale={props.locale}
            today={props.today}
          />
        );
      })}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 bg-foreground/15"
        style={{
          left: `${(scroll / total) * 100}%`,
          width: `${Math.max((trackPx / total) * 100, 1)}%`,
        }}
      />
    </div>
  );
}
