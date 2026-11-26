import type { FloorDrawingElement, FloorDrawingTone } from "@bibi/ui";

/** A table of the drawn layout. */
export type FloorTable = { id: string; drawing: FloorDrawingElement };

export type FloorBlock = {
  id: string;
  tableId: string;
  label: string;
  kind: "BLOCK" | "ONLINE_ONLY";
  startsAtMs: number;
  endsAtMs: number;
  /** `Fri 17:00–22:00`, written on the server. */
  period: string;
  note: string | null;
};

export type FloorReservation = {
  id: string;
  state: string;
  startsAtMs: number;
  endsAtMs: number;
  tableIds: readonly string[];
};

export type TableStatus = {
  tone: FloorDrawingTone;
  reservationId: string | null;
  block: FloorBlock | null;
};

export type TableStatusInput = {
  tableId: string;
  atMs: number;
  reservations: readonly FloorReservation[];
  blocks: readonly FloorBlock[];
};

const HOLDING = new Set(["PENDING_PAYMENT", "BOOKED", "SEATED"]);

const within = ({
  atMs,
  startsAtMs,
  endsAtMs,
}: {
  atMs: number;
  startsAtMs: number;
  endsAtMs: number;
}) => startsAtMs <= atMs && atMs < endsAtMs;

/** A table at a moment: free, booked (selected), seated (warning), or held back by a block. */
export function tableStatus({
  tableId,
  atMs,
  reservations,
  blocks,
}: TableStatusInput): TableStatus {
  const block = blocks.find((one) => one.tableId === tableId && within({ atMs, ...one })) ?? null;
  const reservation = reservations.find(
    (one) => HOLDING.has(one.state) && one.tableIds.includes(tableId) && within({ atMs, ...one }),
  );
  if (reservation)
    return {
      tone: reservation.state === "SEATED" ? "warning" : "selected",
      reservationId: reservation.id,
      block,
    };
  return { tone: block ? "muted" : "default", reservationId: null, block };
}
