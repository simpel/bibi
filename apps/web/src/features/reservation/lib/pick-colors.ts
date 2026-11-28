/**
 * One colour per table opened on the floor, from the categorical chart tokens: the ring on the
 * floor and the edge of its card match. Class names are written out so Tailwind finds them.
 */
export const PICK_COLORS = [
  {
    halo: "fill-chart-1/10 stroke-chart-1/60",
    fill: "fill-chart-1/25 stroke-chart-1",
    edge: "border-l-chart-1",
    dot: "bg-chart-1",
  },
  {
    halo: "fill-chart-2/10 stroke-chart-2/60",
    fill: "fill-chart-2/25 stroke-chart-2",
    edge: "border-l-chart-2",
    dot: "bg-chart-2",
  },
  {
    halo: "fill-chart-4/10 stroke-chart-4/60",
    fill: "fill-chart-4/25 stroke-chart-4",
    edge: "border-l-chart-4",
    dot: "bg-chart-4",
  },
  {
    halo: "fill-chart-5/10 stroke-chart-5/60",
    fill: "fill-chart-5/25 stroke-chart-5",
    edge: "border-l-chart-5",
    dot: "bg-chart-5",
  },
  {
    halo: "fill-chart-3/10 stroke-chart-3/60",
    fill: "fill-chart-3/25 stroke-chart-3",
    edge: "border-l-chart-3",
    dot: "bg-chart-3",
  },
] as const;

export type PickColor = (typeof PICK_COLORS)[number];

/** The first colour no open table uses; past five, they repeat. */
export function nextPickColor({ used }: { used: readonly number[] }): number {
  const free = PICK_COLORS.findIndex((_, index) => !used.includes(index));
  return free === -1 ? used.length % PICK_COLORS.length : free;
}
