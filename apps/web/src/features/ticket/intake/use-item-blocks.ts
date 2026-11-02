import type { CalendarBlockDto } from "@bibi/core";
import { addDays, parseIsoDate, toIsoDate } from "@bibi/core/schemas";
import { useEffect, useState } from "react";
import { loadItemBlocksAction } from "../../calendar/actions";

export type UseItemBlocksInput = {
  /** The requested day, YYYY-MM-DD. */
  date: string;
  itemIds: string[];
  /** Changing it loads again (after a CONFLICT on Create). */
  nonce: number;
};

/**
 * Other bookings of the items the draft uses on the requested day and the next (a line may run
 * past midnight). A failed load shows the snapshot without them.
 */
export function useItemBlocks({ date, itemIds, nonce }: UseItemBlocksInput): CalendarBlockDto[] {
  const [blocks, setBlocks] = useState<CalendarBlockDto[]>([]);
  const ids = [...new Set(itemIds)].sort().slice(0, 50).join(",");
  useEffect(() => {
    if (!ids || !date || nonce < 0) {
      setBlocks([]);
      return;
    }
    let current = true;
    const to = toIsoDate({ date: addDays({ date: parseIsoDate({ value: date }), days: 1 }) });
    loadItemBlocksAction({ from: date, to, itemIds: ids.split(",") })
      .then((result) => current && setBlocks(result.ok ? result.value : []))
      .catch(() => current && setBlocks([]));
    return () => {
      current = false;
    };
  }, [date, ids, nonce]);
  return blocks;
}
