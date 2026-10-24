/** A unit the picker offers. */
export type UnitOption = { id: string; name: string };

/** One slot of a demand on a line, with the units staff can choose from. */
export type AllocationSlot = {
  id: string;
  /** The pool's name (the target item type or specific item). */
  poolName: string;
  /** Which of the demand's units, from 0. */
  slot: number;
  required: boolean;
  /** The unit that holds the slot now; null while unfilled. */
  unitId: string | null;
  /** True when the demand belongs to another allocation's unit (a technician for a projector). */
  chained: boolean;
  /** The free units of the pool, and the current one, in pool order. */
  options: UnitOption[];
  /** The first free unit in pool order; null when none is free. */
  prepickId: string | null;
};

/** What the picker shows for a timed line: its span and the slots of its item's demands. */
export type AllocationView = { startsAt: Date; endsAt: Date; slots: AllocationSlot[] };
