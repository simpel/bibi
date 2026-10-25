"use client";

import { type RefObject, useEffect, useRef } from "react";
import type { CalendarWindow } from "./calendar-types";
import { type Placement, type TimelineView, zoomView } from "./timeline-view";

export type UseZoomGesturesInput = {
  scrollerRef: RefObject<HTMLDivElement | null>;
  labelRef: RefObject<HTMLDivElement | null>;
  view: TimelineView;
  hours: CalendarWindow;
  place: (placement: Placement) => void;
};

/** How fast a wheel notch zooms; a trackpad pinch sends many small deltas. */
const SPEED = 0.01;

type Latest = { current: Omit<UseZoomGesturesInput, "scrollerRef"> };

/** Zooms by `factor` around a viewport x; the pinned label column is not track. */
function zoomer({ scroller, latest }: { scroller: HTMLDivElement; latest: Latest }) {
  return ({ factor, clientX }: { factor: number; clientX: number }) => {
    const { view, hours, place, labelRef } = latest.current;
    if (view.dayPx === 0) return;
    const labelPx = labelRef.current?.offsetWidth ?? 0;
    const x = Math.max(0, clientX - scroller.getBoundingClientRect().left - labelPx);
    place(zoomView({ view, scroll: scroller.scrollLeft, factor, x, hours }));
  };
}

const spreadOf = ({ touches }: { touches: TouchList }) => {
  const [a, b] = [touches[0], touches[1]];
  if (!a || !b) return null;
  const spread = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  return { spread, mid: (a.clientX + b.clientX) / 2 };
};

/** Two fingers apart or together zoom around their midpoint; one finger still scrolls. */
function listenForPinch({
  scroller,
  zoom,
  signal,
}: {
  scroller: HTMLDivElement;
  zoom: ReturnType<typeof zoomer>;
  signal: AbortSignal;
}) {
  let spread = 0;
  scroller.addEventListener(
    "touchstart",
    (event) => {
      spread = spreadOf({ touches: event.touches })?.spread ?? 0;
    },
    { passive: true, signal },
  );
  scroller.addEventListener(
    "touchmove",
    (event) => {
      const now = spreadOf({ touches: event.touches });
      if (!now || spread === 0) return;
      event.preventDefault();
      zoom({ factor: now.spread / spread, clientX: now.mid });
      spread = now.spread;
    },
    { passive: false, signal },
  );
}

/**
 * Ctrl or Cmd plus wheel, a trackpad pinch (sent as a ctrl wheel) and a two-finger pinch on a
 * phone zoom the timeline around the gesture. The listeners are not passive, so the page itself
 * does not zoom; the scroller also sets `touch-action: pan-x pan-y` for that.
 */
export function useZoomGestures({ scrollerRef, ...input }: UseZoomGesturesInput) {
  const latest = useRef(input);
  latest.current = input;
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const zoom = zoomer({ scroller, latest });
    const controller = new AbortController();
    const { signal } = controller;
    scroller.addEventListener(
      "wheel",
      (event) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        zoom({ factor: Math.exp(-event.deltaY * SPEED), clientX: event.clientX });
      },
      { passive: false, signal },
    );
    listenForPinch({ scroller, zoom, signal });
    return () => controller.abort();
  }, [scrollerRef]);
}
