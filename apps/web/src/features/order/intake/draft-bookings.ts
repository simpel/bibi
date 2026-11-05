import type { PreviewLine } from "@bibi/core";
import type { AssetBooking, CalendarState } from "@bibi/ui";
import { daySegments } from "../../calendar/day-segments";
import { flattenDraft } from "./draft-add-ons";
import type { DraftLine } from "./draft-line";

export type DraftBookingsInput = {
  lines: readonly DraftLine[];
  /** The draft's preview lines in the same order; null while none is ready. */
  planned: readonly (PreviewLine | null)[] | null;
  /** The items the calendar has rows for. */
  assetIds: ReadonlySet<string>;
  timeZone: string;
  /** How this order's lines look, and how they look where they clash. */
  draft: CalendarState;
  clash: CalendarState;
  /** "New booking": what the card calls the order that is not created yet. */
  order: string;
};

/**
 * This intake's timed lines on calendar rows (the calendar dialog): one booking per day they
 * touch, on their item, in the draft's look (the clash look where the preview finds one). A
 * bookable add-on is on its item's row like any line (ADR 0088).
 */
export function draftBookings({ assetIds, timeZone, ...rest }: DraftBookingsInput): AssetBooking[] {
  const { lines, planned } = flattenDraft({ lines: rest.lines, planned: rest.planned });
  const look = rest;
  return lines.flatMap((line, index) => {
    const { itemId, startsAt, endsAt } = line;
    if (!itemId || !startsAt || !endsAt || !assetIds.has(itemId)) return [];
    const clashes = planned?.[index]?.issues.some(({ kind }) => kind === "HARD_CLASH") ?? false;
    const range = { startsAt: new Date(startsAt), endsAt: new Date(endsAt), timeZone };
    return daySegments(range).map((segment) => ({
      ...{ id: `draft-${line.key}:${segment.date}`, assetId: itemId, date: segment.date },
      ...{ name: line.name, type: "", place: null, start: segment.start, end: segment.end },
      ...{ setupMinutes: 0, teardownMinutes: 0, quantity: line.quantity ?? 1 },
      ...{ order: look.order, customer: null },
      state: clashes ? look.clash : look.draft,
    }));
  });
}
