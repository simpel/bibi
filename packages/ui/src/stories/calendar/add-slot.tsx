"use client";

import { PlusIcon } from "lucide-react";
import { type PointerEvent, useState } from "react";
import { formatMinutes, percentIn } from "./calendar-time";
import type { CalendarLine, CalendarWindow } from "./calendar-types";
import { freeSlotAt } from "./clashes";

export type AddSlotProps = {
  assetName: string;
  lines: readonly CalendarLine[];
  window: CalendarWindow;
  /** Starts a booking on this asset at a free half hour. */
  onAdd: (slot: { start: string; end: string }) => void;
};

const SNAP = 30;

function minuteAt({ event, window }: { event: PointerEvent; window: CalendarWindow }) {
  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  const minute = window.from + ratio * (window.to - window.from);
  return Math.floor(minute / SNAP) * SNAP;
}

/**
 * The empty track itself: point at free time and a dashed slot offers "+ 10:30"; click or tap
 * adds there. It sits under the blocks, so a booking always wins the pointer.
 */
export function AddSlot({ assetName, lines, window, onAdd }: AddSlotProps) {
  const [slot, setSlot] = useState<CalendarWindow | null>(null);
  const first = freeSlotAt({ lines, from: window.from, window });
  const add = ({ at }: { at: CalendarWindow | null }) =>
    at &&
    onAdd({ start: formatMinutes({ minutes: at.from }), end: formatMinutes({ minutes: at.to }) });
  const place = slot ? percentIn({ window, from: slot.from, to: slot.to }) : null;
  return (
    <button
      type="button"
      aria-label={`Add a booking on ${assetName}`}
      className="absolute inset-0 cursor-copy outline-none focus-visible:bg-accent/40"
      onPointerMove={(event) =>
        setSlot(freeSlotAt({ lines, from: minuteAt({ event, window }), window }))
      }
      onPointerDown={(event) =>
        setSlot(freeSlotAt({ lines, from: minuteAt({ event, window }), window }))
      }
      onPointerLeave={() => setSlot(null)}
      onClick={() => add({ at: slot ?? first })}
    >
      {place && slot ? (
        <span
          className="pointer-events-none absolute top-1.5 h-8 flex items-center gap-1 overflow-hidden rounded-md border border-dashed border-muted-foreground/50 bg-card px-1.5 text-xs text-muted-foreground"
          style={{ left: `${place.offset}%`, width: `${place.size}%` }}
        >
          <PlusIcon aria-hidden className="size-3 shrink-0" />
          <span className="tabular-nums">{formatMinutes({ minutes: slot.from })}</span>
        </span>
      ) : null}
    </button>
  );
}
