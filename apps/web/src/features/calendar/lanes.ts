type Timed = { id: string; startsAt: Date; endsAt: Date; heldAt?: Date | null };

/**
 * Greedy lanes for overlapping blocks of one space (only soft holds overlap, ADR 0044): each block
 * takes the first lane that is free at its start; at the same start the oldest hold goes first. `count` is the number of lanes the row needs.
 */
export function assignLanes({ blocks }: { blocks: readonly Timed[] }) {
  const heldTime = ({ heldAt }: Timed) => heldAt?.getTime() ?? 0;
  const sorted = [...blocks].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime() || heldTime(a) - heldTime(b),
  );
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const block of sorted) {
    const free = laneEnds.findIndex((end) => end <= block.startsAt.getTime());
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = block.endsAt.getTime();
    lanes.set(block.id, lane);
  }
  return { lanes, count: Math.max(1, laneEnds.length) };
}
