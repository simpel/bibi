"use client";

import type { OrderViewDto } from "@bibi/core";
import type { OrderViewFact, UseExtraFactsInput } from "@bibi/ui";
import { useEffect, useState } from "react";
import { viewOrderAction } from "@/features/order/actions";
import { type OrderFactsSource, useOrderViewFacts } from "@/features/order/ui/use-order-view-facts";

/** The facts a pinned card adds from its order; the order's own and the client's are on the card. */
const SHOWN = new Set(["assignee", "total", "balance", "issues"]);

const NO_ORDER: OrderFactsSource = {
  desiredStartsAt: null,
  desiredEndsAt: null,
  customer: null,
  contact: null,
  guestCount: null,
  assignee: null,
  followers: [],
  program: null,
  balance: null,
};

/**
 * Loads the pinned booking's order once its card is expanded (`order.view`, each fact gated by
 * its feature's read) and returns the facts to add; none until it is loaded or without an order.
 */
export function usePinnedOrderFacts({
  booking,
  enabled,
}: UseExtraFactsInput): readonly OrderViewFact[] | undefined {
  const orderId = booking.orderId;
  const [order, setOrder] = useState<OrderViewDto | null>(null);
  const facts = useOrderViewFacts({ order: order ?? NO_ORDER });
  useEffect(() => {
    if (!enabled || !orderId) return;
    let current = true;
    viewOrderAction({ id: orderId }).then((result) => {
      if (current && result.ok) setOrder(result.value);
    });
    return () => {
      current = false;
    };
  }, [enabled, orderId]);
  return order ? facts.filter(({ key }) => SHOWN.has(key)) : undefined;
}
