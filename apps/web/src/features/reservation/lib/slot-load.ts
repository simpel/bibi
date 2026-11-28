import type { ReservationRow } from "./reservation-row";

export type SlotLoadInput = {
  rows: readonly ReservationRow[];
  ms: number;
  /** All seats of the floor used at that time. */
  seats: number;
};

export type SlotLoad = { taken: number; seats: number; ratio: number };

/** How full the floor is at an instant: people at tables then, against all the seats. */
export function slotLoad({ rows, ms, seats }: SlotLoadInput): SlotLoad {
  const taken = rows
    .filter((row) => row.state !== "NO_SHOW" && row.startsAtMs <= ms && ms < row.endsAtMs)
    .reduce((sum, row) => sum + row.partySize, 0);
  return { taken, seats, ratio: seats > 0 ? Math.min(1, taken / seats) : 0 };
}

/** green: room; amber: filling up; red: full. */
export function loadTone({ ratio }: { ratio: number }): "low" | "mid" | "full" {
  if (ratio >= 0.95) return "full";
  return ratio >= 0.6 ? "mid" : "low";
}
