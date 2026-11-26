import type { ReservationState } from "@bibi/core/schemas";

/** A reservation as the day list and floor need it: every text written on the server. */
export type ReservationRow = {
  id: string;
  /** `19:00`, in the room's zone. */
  time: string;
  startsAtMs: number;
  endsAtMs: number;
  partySize: number;
  name: string;
  tables: string;
  tableIds: string[];
  needs: string;
  source: "STAFF" | "WEB" | "API";
  sourceLabel: string;
  state: ReservationState;
  stateLabel: string;
};

/** What staff may do next from a state (ADR 0119: lifecycle). */
export const NEXT_ACTIONS: Record<
  ReservationState,
  readonly ("seat" | "unseat" | "complete" | "markNoShow" | "cancel")[]
> = {
  PENDING_PAYMENT: ["cancel"],
  BOOKED: ["seat", "markNoShow", "cancel"],
  SEATED: ["unseat", "complete"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export type StaffAction = (typeof NEXT_ACTIONS)[ReservationState][number];

export type NeedRow = { vocabularyValueId: string; quantity: number };

export type NeedsLabelInput = {
  needs: readonly NeedRow[];
  names: ReadonlyMap<string, string>;
};

/** `Gluten 3, Vegan 1`; a value no longer in a list shows as "?". */
export function needsLabel({ needs, names }: NeedsLabelInput): string {
  return needs
    .map((need) => `${names.get(need.vocabularyValueId) ?? "?"} ${need.quantity}`)
    .join(", ");
}
