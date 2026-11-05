import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { useDraftPreview } from "./use-draft-preview";
import { type LineTone, lineTone } from "./use-issue-text";
import type { ReviewModel } from "./use-review-model";

const HOUR = 3_600_000;

type ProbeInput = { item: CatalogItem; start: Date; lineTypeId: string };

/** A probe line: the item from the order's start for its default length (else an hour). */
function probe({ item, start, lineTypeId }: ProbeInput): DraftLine {
  const minutes = item.defaultDurationMinutes;
  const end = new Date(start.getTime() + (minutes ? minutes * 60_000 : HOUR));
  return {
    ...{ key: item.id, entityTypeId: lineTypeId, name: item.name, itemId: item.id },
    ...{ setupId: null, startsAt: start.toISOString(), endsAt: end.toISOString() },
    ...{ quantity: null, unitPriceMinor: null, discountPercent: null, note: null },
    ...{ options: [], needs: [], addOns: [], fields: {} },
  };
}

export type UseSearchAvailabilityInput = { model: ReviewModel; items: CatalogItem[] };

/**
 * Each bookable result's availability at the order's start (spec "The line dialog"): one
 * `order.previewLines` call with a probe line per item. Items that are not bookable have none.
 */
export function useSearchAvailability({
  model,
  items,
}: UseSearchAvailabilityInput): ReadonlyMap<string, LineTone> {
  const lineTypeId = model.data.catalog.lineTypes[0]?.id;
  const start = model.period?.startsAt;
  const bookable = items.filter((item) => item.capabilities.includes("BOOKABLE"));
  const lines =
    start && lineTypeId ? bookable.map((item) => probe({ item, start, lineTypeId })) : [];
  const preview = useDraftPreview({
    ...{ customerId: model.who.customerId, period: model.period, headcount: model.when.guests },
    ...{ lines, nonce: 0 },
  });
  if (preview.status !== "ready" || preview.availabilityHidden) return new Map();
  return new Map(
    lines.map((line, index) => [line.key, lineTone({ planned: preview.entry.lines[index] })]),
  );
}
