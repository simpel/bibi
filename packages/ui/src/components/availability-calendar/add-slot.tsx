"use client";

import { PlusIcon } from "lucide-react";
import { type PointerEvent, useRef, useState } from "react";
import { useCalendarLabels } from "./calendar-labels";
import { formatMinutes, percentIn } from "./calendar-time";
import type { CalendarLine, CalendarWindow } from "./calendar-types";
import { freeSlotAt, freeSpanAt } from "./clashes";

export type AddSlotProps = {
  assetName: string;
  lines: readonly CalendarLine[];
  window: CalendarWindow;
  /** Starts a booking on this asset at a free half hour or dragged span. */
  onAdd: (slot: { start: string; end: string }) => void;
};

const SNAP = 30;

function minuteAt({ event, window }: { event: PointerEvent; window: CalendarWindow }) {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const minute = window.from + ratio * (window.to - window.from);
  const snapped = Math.floor(minute / SNAP) * SNAP;
  return Math.max(window.from, Math.min(window.to - SNAP, snapped));
}

/** Room for "+ 10:30 PM", the longest time a slot shows. */
const MIN_SLOT = "5rem";

/** At least wide enough for its time on hover; while dragging, exact to the span's edges. */
function edgeOf({
  place,
  dragging,
}: {
  place: { offset: number; size: number };
  dragging: boolean;
}) {
  if (dragging) return { left: `${place.offset}%`, width: `${place.size}%` };
  const width = `max(${MIN_SLOT}, ${place.size}%)`;
  return { left: `min(${place.offset}%, 100% - ${width})`, width };
}

function SlotPreview({
  slot,
  window,
  dragging,
}: {
  slot: CalendarWindow;
  window: CalendarWindow;
  dragging: boolean;
}) {
  const { clock } = useCalendarLabels();
  const place = percentIn({ window, from: slot.from, to: slot.to });
  const text = dragging
    ? `${clock({ minutes: slot.from })}–${clock({ minutes: slot.to })}`
    : clock({ minutes: slot.from });
  return (
    <span
      className="pointer-events-none absolute top-1.5 h-8 flex whitespace-nowrap items-center gap-1 overflow-hidden rounded-md border border-dashed border-muted-foreground/50 bg-card px-1.5 text-xs text-muted-foreground"
      style={edgeOf({ place, dragging })}
    >
      <PlusIcon aria-hidden className="size-3 shrink-0" />
      <span className="tabular-nums">{text}</span>
    </span>
  );
}

type DragState = { anchor: number; moved: boolean } | null;

function useSlotGesture({ lines, window, onAdd }: Omit<AddSlotProps, "assetName">) {
  const [slot, setSlot] = useState<CalendarWindow | null>(null);
  const [drag, setDrag] = useState<DragState>(null);
  const pointerAdded = useRef(false);
  const add = ({ at }: { at: CalendarWindow | null }) =>
    at &&
    onAdd({ start: formatMinutes({ minutes: at.from }), end: formatMinutes({ minutes: at.to }) });
  const spanAt = ({ anchor, target, moved }: { anchor: number; target: number; moved: boolean }) =>
    moved
      ? freeSpanAt({ lines, anchor, target, window })
      : freeSlotAt({ lines, from: anchor, window });
  return {
    slot,
    dragging: Boolean(drag?.moved),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      const anchor = minuteAt({ event, window });
      const initial = event.button === 0 ? freeSlotAt({ lines, from: anchor, window }) : null;
      if (!initial) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({ anchor, moved: false });
      setSlot(initial);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const target = minuteAt({ event, window });
      if (!drag) return setSlot(freeSlotAt({ lines, from: target, window }));
      const moved = drag.moved || target !== drag.anchor;
      setDrag({ anchor: drag.anchor, moved });
      setSlot(spanAt({ anchor: drag.anchor, target, moved }));
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      if (!drag) return;
      const target = minuteAt({ event, window });
      setDrag(null);
      pointerAdded.current = true;
      add({
        at: spanAt({ anchor: drag.anchor, target, moved: drag.moved || target !== drag.anchor }),
      });
      setSlot(freeSlotAt({ lines, from: target, window }));
    },
    onPointerCancel: () => setDrag(null),
    onPointerLeave: () => !drag && setSlot(null),
    onClick: () => {
      if (!pointerAdded.current)
        add({ at: slot ?? freeSlotAt({ lines, from: window.from, window }) });
      pointerAdded.current = false;
    },
  };
}

/**
 * The empty track itself: point at free time and a dashed slot offers "+ 10:30"; click to book an
 * hour, or drag left or right to book a timespan. It sits under the blocks, so a booking always
 * wins the pointer.
 */
export function AddSlot({ assetName, lines, window, onAdd }: AddSlotProps) {
  const labels = useCalendarLabels();
  const { slot, dragging, ...handlers } = useSlotGesture({ lines, window, onAdd });
  return (
    <button
      type="button"
      aria-label={labels.addBooking({ asset: assetName })}
      className="absolute inset-0 cursor-copy touch-none select-none outline-none focus-visible:bg-accent/40"
      {...handlers}
    >
      {slot ? <SlotPreview slot={slot} window={window} dragging={dragging} /> : null}
    </button>
  );
}
