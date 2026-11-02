import { useEffect, useState } from "react";
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

/**
 * Other bookings' timed lines of those items on the requested day and the next (a line may run
 * past midnight). A failed load shows the snapshot without them.
 */
export function useItemLines({ midnight, itemIds, nonce }: UseItemLinesInput): ItemLine[] {
  const [lines, setLines] = useState<ItemLine[]>([]);
  const ids = [...new Set(itemIds)].sort().join(",");
  const from = midnight?.toISOString() ?? "";
  useEffect(() => {
    if (!ids || !from || nonce < 0) {
      setLines([]);
      return;
    }
    let current = true;
    const to = new Date(new Date(from).getTime() + 2 * DAY).toISOString();
    loadItemLinesAction({ itemIds: ids.split(","), from, to })
      .then((result) => current && setLines(result.ok ? result.value : []))
      .catch(() => current && setLines([]));
    return () => {
      current = false;
    };
  }, [from, ids, nonce]);
  return lines;
}
