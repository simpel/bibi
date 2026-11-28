"use client";

import { Button } from "@bibi/ui";
import { MaximizeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type PointerEvent, type ReactNode, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 6;
/** A touch that travels less than this is a tap, not a drag. */
const DRAG_PX = 6;
const BUTTON_STEP = 1.5;

type View = { scale: number; x: number; y: number };
type Size = { width: number; height: number };

const IDENTITY: View = { scale: 1, x: 0, y: 0 };

const clamp = ({ value, min, max }: { value: number; min: number; max: number }) =>
  Math.min(max, Math.max(min, value));

/** Keeps the zoomed content covering the frame: no empty edges, back to the start at 1x. */
function fit({ view, width, height }: Size & { view: View }): View {
  if (view.scale <= MIN_SCALE) return IDENTITY;
  return {
    scale: view.scale,
    x: clamp({ value: view.x, min: width * (1 - view.scale), max: 0 }),
    y: clamp({ value: view.y, min: height * (1 - view.scale), max: 0 }),
  };
}

type ZoomInput = Size & { view: View; to: number; cx: number; cy: number };

/** Zoom to a scale so the point (cx, cy) of the frame stays where it is. */
function zoomAt({ view, to, cx, cy, width, height }: ZoomInput): View {
  const scale = clamp({ value: to, min: MIN_SCALE, max: MAX_SCALE });
  const ratio = scale / view.scale;
  const next = { scale, x: cx - (cx - view.x) * ratio, y: cy - (cy - view.y) * ratio };
  return fit({ view: next, width, height });
}

type Point = { x: number; y: number };

/**
 * Pinch to zoom, drag to pan, wheel to zoom, and big buttons as a fallback: the floor on a
 * touchscreen. A drag never counts as a tap on a table.
 */
export function PanZoom({ children }: { children: ReactNode }) {
  const t = useTranslations("reservation.floor");
  const frame = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({ travel: 0, moved: false, lastDistance: 0 });
  const [view, setView] = useState<View>(IDENTITY);
  const measure = () => {
    const box = frame.current?.getBoundingClientRect();
    return {
      width: box?.width ?? 0,
      height: box?.height ?? 0,
      left: box?.left ?? 0,
      top: box?.top ?? 0,
    };
  };
  const zoomBy = ({ factor, cx, cy }: { factor: number; cx?: number; cy?: number }) => {
    const { width, height } = measure();
    setView((prev) =>
      zoomAt({
        view: prev,
        to: prev.scale * factor,
        cx: cx ?? width / 2,
        cy: cy ?? height / 2,
        width,
        height,
      }),
    );
  };
  // Syncs with the browser: the wheel listener must be non-passive to stop the page from scrolling.
  // biome-ignore lint/correctness/useExhaustiveDependencies: zoomBy only reads refs and setState
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const onWheel = ({ event }: { event: WheelEvent }) => {
      event.preventDefault();
      const { left, top } = measure();
      zoomBy({
        factor: Math.exp(-event.deltaY * 0.002),
        cx: event.clientX - left,
        cy: event.clientY - top,
      });
    };
    const abort = new AbortController();
    node.addEventListener("wheel", (event) => onWheel({ event }), {
      passive: false,
      signal: abort.signal,
    });
    return () => abort.abort();
  }, []);
  const down = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) gesture.current = { travel: 0, moved: false, lastDistance: 0 };
  };
  const move = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    const before = pointers.current.get(event.pointerId);
    if (!before) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, now);
    const { width, height, left, top } = measure();
    const points = [...pointers.current.values()];
    const [a, b] = points;
    if (a && b) {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const last = gesture.current.lastDistance;
      gesture.current = { ...gesture.current, moved: true, lastDistance: distance };
      if (last === 0) return;
      const cx = (a.x + b.x) / 2 - left;
      const cy = (a.y + b.y) / 2 - top;
      const shift = { x: (now.x - before.x) / 2, y: (now.y - before.y) / 2 };
      setView((prev) => {
        const zoomed = zoomAt({
          view: prev,
          to: (prev.scale * distance) / last,
          cx,
          cy,
          width,
          height,
        });
        return fit({
          view: { ...zoomed, x: zoomed.x + shift.x, y: zoomed.y + shift.y },
          width,
          height,
        });
      });
      return;
    }
    const dx = now.x - before.x;
    const dy = now.y - before.y;
    gesture.current.travel += Math.hypot(dx, dy);
    if (gesture.current.travel > DRAG_PX) {
      if (!gesture.current.moved) frame.current?.setPointerCapture(event.pointerId);
      gesture.current.moved = true;
      setView((prev) => fit({ view: { ...prev, x: prev.x + dx, y: prev.y + dy }, width, height }));
    }
  };
  const up = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current.lastDistance = 0;
  };
  return (
    <div
      ref={frame}
      className="relative size-full touch-none select-none overflow-hidden"
      onPointerDown={(event) => down({ event })}
      onPointerMove={(event) => move({ event })}
      onPointerUp={(event) => up({ event })}
      onPointerCancel={(event) => up({ event })}
      onClickCapture={(event) => {
        // A drag or pinch ends with a click: keep it from reaching the table under the finger.
        if (gesture.current.moved) event.stopPropagation();
      }}
    >
      <div
        className="size-full origin-top-left"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        {children}
      </div>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: only stops a button press from starting a pan */}
      <div
        className="absolute bottom-3 left-3 flex flex-col gap-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Button
          variant="outline"
          className="size-12 bg-card"
          aria-label={t("zoomIn")}
          disabled={view.scale >= MAX_SCALE}
          onClick={() => zoomBy({ factor: BUTTON_STEP })}
        >
          <PlusIcon className="size-5" />
        </Button>
        <Button
          variant="outline"
          className="size-12 bg-card"
          aria-label={t("zoomOut")}
          disabled={view.scale <= MIN_SCALE}
          onClick={() => zoomBy({ factor: 1 / BUTTON_STEP })}
        >
          <MinusIcon className="size-5" />
        </Button>
        <Button
          variant="outline"
          className="size-12 bg-card"
          aria-label={t("zoomReset")}
          disabled={view.scale === MIN_SCALE}
          onClick={() => setView(IDENTITY)}
        >
          <MaximizeIcon className="size-5" />
        </Button>
      </div>
    </div>
  );
}
