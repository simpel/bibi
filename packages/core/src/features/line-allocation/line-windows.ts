import type { OperationContext } from "../../operations/types";
import { effectiveBuffers } from "../../shared/buffers";
import type { DemandWindow } from "../item-demand/schema";

/** One window of a timed line (ADR 0059). */
export type LineWindow = { window: DemandWindow; startsAt: Date; endsAt: Date };

export type WindowsOfInput = { startsAt: Date; endsAt: Date; setup: number; teardown: number };

const shift = ({ at, minutes }: { at: Date; minutes: number }) =>
  new Date(at.getTime() + minutes * 60_000);

/**
 * A line's setup buffer, booking and teardown buffer, leaving out empty ones. The trigger
 * `sync_line_occupancy` derives allocation holds from the same windows.
 */
export function windowsOf({ startsAt, endsAt, setup, teardown }: WindowsOfInput): LineWindow[] {
  const windows: LineWindow[] = [
    { window: "SETUP", startsAt: shift({ at: startsAt, minutes: -setup }), endsAt: startsAt },
    { window: "BOOKING", startsAt, endsAt },
    { window: "TEARDOWN", startsAt: endsAt, endsAt: shift({ at: endsAt, minutes: teardown }) },
  ];
  return windows.filter((window) => window.endsAt > window.startsAt);
}

const minutes = { setupMinutes: true, teardownMinutes: true } as const;

export type LineWindowsInput = { context: Pick<OperationContext, "db">; lineId: string };

/** The windows of an active timed line with its effective buffers; null when untimed. */
export async function lineWindows({ context, lineId }: LineWindowsInput) {
  const line = await context.db.line.findFirst({
    where: { id: lineId },
    select: {
      ...{ startsAt: true, endsAt: true, ...minutes },
      setup: { select: { changeoverMinutes: true } },
      item: { select: { ...minutes, entityType: { select: minutes } } },
    },
  });
  if (!line?.startsAt || !line.endsAt) return null;
  const buffers = effectiveBuffers({
    line,
    item: line.item,
    type: line.item?.entityType ?? null,
    changeoverMinutes: line.setup?.changeoverMinutes ?? null,
  });
  return windowsOf({
    startsAt: line.startsAt,
    endsAt: line.endsAt,
    setup: buffers.effectiveSetupMinutes,
    teardown: buffers.effectiveTeardownMinutes,
  });
}
