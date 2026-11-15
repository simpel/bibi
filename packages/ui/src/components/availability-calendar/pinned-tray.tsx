"use client";

import { useStoredState } from "../../lib/use-stored-state";
import { useCalendarLabels } from "./calendar-labels";
import type { PinnedBookingsProps } from "./pinned-bookings";
import { PinnedCard } from "./pinned-card";
import type { PinnedBooking } from "./pins-context";

export type PinnedTrayProps = Pick<
  PinnedBookingsProps,
  "formatDate" | "onOpen" | "useExtraFacts"
> & {
  pins: readonly PinnedBooking[];
  onClose: (input: { booking: PinnedBooking }) => void;
  /** Kept with the pins, so a reload keeps a shrunk card shrunk. */
  storageKey?: string | undefined;
};

const NONE: readonly string[] = [];

/**
 * The pinned bookings along the bottom, side by side in the order they were pinned, so two
 * clients, days or offers can be read together. They stay on every page; a card can shrink to
 * its client and value, and only its X takes it off.
 */
export function PinnedTray({ pins, onOpen, onClose, storageKey, ...card }: PinnedTrayProps) {
  const labels = useCalendarLabels();
  const [minimized, setMinimized] = useStoredState<readonly string[]>({
    key: storageKey ? `${storageKey}:minimized` : undefined,
    initial: NONE,
    storage: "session",
  });
  if (!pins.length) return null;
  const flip = ({ id }: { id: string }) =>
    setMinimized((ids) => (ids.includes(id) ? ids.filter((one) => one !== id) : [...ids, id]));
  return (
    <section
      aria-label={labels.pinned}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end"
    >
      <div className="pointer-events-auto flex max-w-full items-end gap-3 overflow-x-auto p-1">
        {pins.map((booking) => (
          <PinnedCard
            key={booking.id}
            booking={booking}
            minimized={minimized.includes(booking.id)}
            onMinimize={() => flip({ id: booking.id })}
            onClose={() => onClose({ booking })}
            onOpen={onOpen ? () => onOpen(booking) : undefined}
            {...card}
          />
        ))}
      </div>
    </section>
  );
}
