import type { CalendarHoverDetailsProps } from "../cursor-hover/cursor-hover-details";

/** One bar on a row, in minutes from the day's midnight (past 1440 is the next day). */
export type DaySnapshotBlock = {
  id: string;
  start: number;
  end: number;
  label: string;
  tone: "hard" | "soft" | "draft" | "clash" | "own";
  href?: string;
  details?: CalendarHoverDetailsProps;
};

export type LanedBlock = DaySnapshotBlock & { lane: number };

export type LanesInput = { blocks: readonly DaySnapshotBlock[] };

/**
 * Bars that overlap in time go on separate lanes, so no bar (or its label) is drawn over
 * another: each bar, by start, takes the first lane free by then. At least one lane.
 */
export function laneBlocks({ blocks }: LanesInput): { blocks: LanedBlock[]; lanes: number } {
  const ends: number[] = [];
  const ordered = blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => a.block.start - b.block.start || a.index - b.index);
  const laned = ordered.map(({ block }) => {
    const free = ends.findIndex((end) => end <= block.start);
    const lane = free === -1 ? ends.length : free;
    ends[lane] = block.end;
    return { ...block, lane };
  });
  return { blocks: laned, lanes: Math.max(1, ends.length) };
}
