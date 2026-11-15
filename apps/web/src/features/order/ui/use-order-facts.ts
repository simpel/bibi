"use client";

import type { OrderViewDto } from "@bibi/core";
import type { OrderViewFact } from "@bibi/ui";
import { useEffect, useState } from "react";
import { viewOrderAction } from "../actions";
import { type OrderFactsSource, useOrderViewFacts } from "./use-order-view-facts";

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

export type UseOrderFactsInput = {
  orderId: string | undefined;
  /** Loads only once the card that shows them opens. */
  enabled: boolean;
  /** Which of the order's facts to show, in their usual order. */
  keys: ReadonlySet<string>;
};

/**
 * Loads an order once its card opens (`order.view`, each fact gated by its feature's read) and
 * returns the asked-for facts; undefined until loaded or without an order. Shared by the pinned
 * bookings and My work, so the facts read the same.
 */
export function useOrderFacts({
  orderId,
  enabled,
  keys,
}: UseOrderFactsInput): readonly OrderViewFact[] | undefined {
  const [order, setOrder] = useState<OrderViewDto | null>(null);
  const facts = useOrderViewFacts({ order: order ?? NO_ORDER });
  // Server action on open: loads the order the first time its card is opened.
  useEffect(() => {
    if (!enabled || !orderId || order) return;
    let current = true;
    viewOrderAction({ id: orderId }).then((result) => {
      if (current && result.ok) setOrder(result.value);
    });
    return () => {
      current = false;
    };
  }, [enabled, orderId, order]);
  return order ? facts.filter(({ key }) => keys.has(key)) : undefined;
}
