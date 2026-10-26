import type { CalendarBlockDto } from "@bibi/core/schemas";
import type { AssetBooking, CalendarState } from "@bibi/ui";
import { bookingDetailsOf, type ContactVia } from "./booking-details";
import { daySegments } from "./day-segments";
import { inkOn } from "./ink-on";

/** Buffers are drawn on their hold, so they are keyed by the line and item they belong to. */
const bufferKey = ({ lineId, itemId }: { lineId: string | null; itemId: string }) =>
  `${lineId}:${itemId}`;

const minutes = ({ startsAt, endsAt }: CalendarBlockDto) =>
  Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);

/** Setup and teardown minutes per line and item (ADR 0059: buffers take the space, unsold). */
function buffersOf({ blocks }: { blocks: readonly CalendarBlockDto[] }) {
  const buffers = new Map<string, { setup: number; teardown: number }>();
  for (const block of blocks) {
    if (block.type !== "SETUP" && block.type !== "TEARDOWN") continue;
    const key = bufferKey(block);
    const own = buffers.get(key) ?? { setup: 0, teardown: 0 };
    if (block.type === "SETUP") own.setup += minutes(block);
    else own.teardown += minutes(block);
    buffers.set(key, own);
  }
  return buffers;
}

export type ToAssetBookingsInput = {
  blocks: readonly CalendarBlockDto[];
  timeZone: string;
  /** The grey "not sold" state of a manual block, named by the app. */
  blocked: CalendarState;
  /** A line's state when its name and colour are hidden (no `pipeline:read`). */
  unnamed: CalendarState;
  /** Why the contact is the one to call, in the app's words. */
  via: ContactVia;
  /** Where a booking opens: its ticket. */
  ticketHref: (input: { ticketId: string }) => string;
};

/** The block's state: the line's own colour, a soft or hard hold (ADR 0044). */
function stateOf({ block, blocked, unnamed }: { block: CalendarBlockDto } & ToStateInput) {
  if (!block.lineId) return blocked;
  if (!block.stateColor) return { ...unnamed, hold: block.soft ? "soft" : "hard" } as const;
  return {
    name: block.stateName ?? unnamed.name,
    color: block.stateColor,
    ink: inkOn({ color: block.stateColor }),
    hold: block.soft ? "soft" : "hard",
  } satisfies CalendarState;
}

type ToStateInput = Pick<ToAssetBookingsInput, "blocked" | "unnamed">;

/**
 * `calendar.range` blocks as the availability calendar's bookings: holds and manual blocks, each
 * cut at midnight in the zone, with their setup and teardown folded in at either end.
 */
export function toAssetBookings({
  blocks,
  timeZone,
  ticketHref,
  via,
  ...states
}: ToAssetBookingsInput) {
  const buffers = buffersOf({ blocks });
  return blocks.flatMap((block): AssetBooking[] => {
    if (block.type === "SETUP" || block.type === "TEARDOWN") return [];
    const buffer = buffers.get(bufferKey(block));
    const state = stateOf({ block, ...states });
    const ticket = block.reference === null ? null : `#${block.reference}`;
    const href = block.ticketId ? ticketHref({ ticketId: block.ticketId }) : undefined;
    const details = block.details ? bookingDetailsOf({ details: block.details, via }) : {};
    return daySegments({ ...block, timeZone }).map((segment) => ({
      id: `${block.id}:${segment.date}`,
      assetId: block.itemId,
      date: segment.date,
      name: block.title ?? ticket ?? "",
      type: "",
      place: null,
      start: segment.start,
      end: segment.end,
      setupMinutes: segment.first ? (buffer?.setup ?? 0) : 0,
      teardownMinutes: segment.last ? (buffer?.teardown ?? 0) : 0,
      state,
      quantity: 1,
      ticket,
      customer: null,
      ...details,
      ...(href ? { href } : {}),
      ...(block.lineId ? { lineId: block.lineId } : {}),
      ...(block.ticketId ? { ticketId: block.ticketId } : {}),
    }));
  });
}
