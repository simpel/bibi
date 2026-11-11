/** What a layout says about itself besides its drawing (ADR 0103); stored with Save. */
export type LayoutFacts = {
  name: string;
  /** What the layout suits. */
  description: string | null;
  /** Typed capacity; null = the layout's seats. */
  capacity: number | null;
  /** null = the room's. */
  setupMinutes: number | null;
  teardownMinutes: number | null;
};

export const sameFacts = ({ a, b }: { a: LayoutFacts; b: LayoutFacts }) =>
  a.name === b.name &&
  a.description === b.description &&
  a.capacity === b.capacity &&
  a.setupMinutes === b.setupMinutes &&
  a.teardownMinutes === b.teardownMinutes;

/** The capacity that counts: the typed one, else the seats (none while nothing is drawn). */
export const effectiveCapacityOf = ({
  capacity,
  seats,
}: {
  capacity: number | null;
  seats: number;
}) => capacity ?? (seats > 0 ? seats : null);
