"use client";

import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { addDays, daysBetween } from "./calendar-dates";
import type { CalendarWindow } from "./calendar-types";
import { anchorOf, floorDayPx, levelDays, type TimelineLevel } from "./timeline-scale";
import { CHUNK, extendView, jumpView, type Placement, type TimelineView } from "./timeline-view";
import { useZoomGestures } from "./use-zoom-gestures";

/** The track's visible width: the scroller less the pinned label column. */
function useTrackWidth() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [trackPx, setTrackPx] = useState(0);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => setTrackPx(scroller.clientWidth - (labelRef.current?.offsetWidth ?? 0));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);
  return { scrollerRef, labelRef, trackPx };
}

export type UseTimelineInput = {
  today: string;
  hours: CalendarWindow;
  /** The range shown first, around today. */
  initialLevel?: TimelineLevel;
  /** Days to show first instead, e.g. from the URL; `to` is inclusive. Wins over the level. */
  initialRange?: { from: string; to: string };
  /** The loaded days changed: load their bookings. `to` is inclusive. */
  onRangeChange?: (range: { from: string; to: string }) => void;
};

/** The view, and the scroll it asked for, applied once its new widths have rendered. */
function usePlacedView({
  scrollerRef,
  around,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>;
  around: string;
}) {
  const [view, setView] = useState<TimelineView>({
    start: addDays({ date: around, days: -CHUNK }),
    count: CHUNK * 3,
    dayPx: 0,
  });
  const [scroll, setScroll] = useState(0);
  const pending = useRef<number | null>(null);
  const place = useCallback((placement: Placement) => {
    pending.current = placement.scroll;
    setView(placement.view);
  }, []);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs after each new view renders.
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (pending.current === null || !scroller) return;
    scroller.scrollLeft = pending.current;
    pending.current = null;
    setScroll(scroller.scrollLeft);
  }, [view, scrollerRef]);
  return { view, scroll, setScroll, place };
}

/** What to show first: the given days, else the level around today. */
function firstJump({
  today,
  hours,
  initialLevel,
  initialRange,
}: Pick<UseTimelineInput, "today" | "hours" | "initialRange"> & { initialLevel: TimelineLevel }) {
  if (!initialRange) {
    const date = anchorOf({ level: initialLevel, date: today });
    const floor = floorDayPx({ level: initialLevel, hours });
    return { date, days: levelDays({ level: initialLevel, date }), floor };
  }
  const days = daysBetween(initialRange) + 1;
  const level: TimelineLevel = days === 1 ? "day" : days <= 7 ? "week" : "month";
  return { date: initialRange.from, days, floor: floorDayPx({ level, hours }) };
}

/**
 * The timeline's state: loaded days, zoom and scroll. A change of view says where to scroll once
 * the new widths render, so zooming and loading more days never make the track jump.
 */
export function useTimeline({
  today,
  hours,
  initialLevel = "day",
  initialRange,
  onRangeChange,
}: UseTimelineInput) {
  const { scrollerRef, labelRef, trackPx } = useTrackWidth();
  const around = initialRange?.from ?? today;
  const { view, scroll, setScroll, place } = usePlacedView({ scrollerRef, around });
  const [first] = useState(() => firstJump({ today, hours, initialLevel, initialRange }));
  useEffect(() => {
    if (trackPx === 0 || view.dayPx > 0) return;
    place(jumpView({ view, ...first, trackPx, hours }));
  }, [trackPx, view, hours, place, first]);
  useEffect(() => {
    onRangeChange?.({ from: view.start, to: addDays({ date: view.start, days: view.count - 1 }) });
  }, [view.start, view.count, onRangeChange]);
  const onScroll = useCallback(() => {
    const left = scrollerRef.current?.scrollLeft ?? 0;
    setScroll(left);
    const grown = view.dayPx > 0 ? extendView({ view, scroll: left, trackPx }) : null;
    if (grown) place(grown);
  }, [view, trackPx, place, scrollerRef, setScroll]);
  useZoomGestures({ scrollerRef, labelRef, view, hours, place });
  const jump = useCallback(
    (to: Pick<Parameters<typeof jumpView>[0], "date" | "days" | "floor" | "dayPx">) => {
      const placement = jumpView({ view, trackPx, hours, ...to });
      place(placement);
      return placement;
    },
    [view, trackPx, hours, place],
  );
  return { scrollerRef, labelRef, trackPx, view, scroll, onScroll, jump };
}

export type Timeline = ReturnType<typeof useTimeline>;
