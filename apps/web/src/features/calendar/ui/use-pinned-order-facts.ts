"use client";

import type { OrderViewFact, UseExtraFactsInput } from "@bibi/ui";
import { useOrderFacts } from "@/features/order/ui/use-order-facts";

/** The facts a pinned card adds from its order; the order's own and the client's are on the card. */
const SHOWN = new Set(["assignee", "total", "balance", "issues"]);

/** The pinned booking's order facts once its card is expanded (see `useOrderFacts`). */
export function usePinnedOrderFacts({
  booking,
  enabled,
}: UseExtraFactsInput): readonly OrderViewFact[] | undefined {
  return useOrderFacts({ orderId: booking.orderId, enabled, keys: SHOWN });
}
