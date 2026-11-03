import type { CalendarBlockDto } from "@bibi/core";
import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { lastValue } from "@/lib/live-query-state";
import { useLiveQuery } from "@/lib/use-live-query";
import { loadItemBlocksAction } from "../../calendar/actions";

export type UseItemBlocksInput = {
  /** The requested day, YYYY-MM-DD. */
  date: string;
  itemIds: string[];
  /** Changing it loads again (after a CONFLICT on Create). */
  nonce: number;
};

type Query = { from: string; itemIds: string[]; nonce: number };

const loadBlocks = ({ from, itemIds }: Query) => {
  const to = toIsoDate({ date: addDays({ date: parseIsoDate({ value: from }), days: 1 }) });
  return loadItemBlocksAction({ from, to, itemIds });
};

/**
 * Other bookings of the items the draft uses on the requested day and the next (a line may run
 * past midnight). A failed load shows the snapshot without them.
 */
export function useItemBlocks({ date, itemIds, nonce }: UseItemBlocksInput): CalendarBlockDto[] {
  const ids = [...new Set(itemIds)].sort().slice(0, 50);
  const asking = ids.length > 0 && date !== "" && nonce >= 0;
  const state = useLiveQuery({
    input: asking ? { from: date, itemIds: ids, nonce } : null,
    load: loadBlocks,
  });
  return lastValue({ state }) ?? [];
}
