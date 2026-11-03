import { lastValue } from "@/lib/live-query-state";
import { useLiveQuery } from "@/lib/use-live-query";
import { type ItemLine, loadItemLinesAction } from "../../line/actions";

const DAY = 24 * 60 * 60_000;

export type UseItemLinesInput = {
  /** The requested day's midnight in the organization's zone. */
  midnight: Date | null;
  /** Items without occupancy (not bookable) that the draft's timed lines use. */
  itemIds: string[];
  /** Changing it loads again (after a CONFLICT on Create). */
  nonce: number;
};

type Query = { from: string; itemIds: string[]; nonce: number };

const loadLines = ({ from, itemIds }: Query) => {
  const to = new Date(new Date(from).getTime() + 2 * DAY).toISOString();
  return loadItemLinesAction({ itemIds, from, to });
};

/**
 * Other bookings' timed lines of those items on the requested day and the next (a line may run
 * past midnight). A failed load shows the snapshot without them.
 */
export function useItemLines({ midnight, itemIds, nonce }: UseItemLinesInput): ItemLine[] {
  const ids = [...new Set(itemIds)].sort();
  const from = midnight?.toISOString();
  const state = useLiveQuery({
    input: from && ids.length > 0 && nonce >= 0 ? { from, itemIds: ids, nonce } : null,
    load: loadLines,
  });
  return lastValue({ state }) ?? [];
}
