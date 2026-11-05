"use client";

import { useEffect, useState } from "react";
import { loadOrderSheetAction } from "../actions";
import type { OrderSheetData } from "../load-order-sheet";

export type OrderSheetState =
  | { phase: "closed" }
  | { phase: "loading" }
  | { phase: "failed" }
  | { phase: "ready"; data: OrderSheetData };

/** The open order's sheet content, read once per order it opens on. */
export function useOrderSheet({ orderId }: { orderId: string | null }): OrderSheetState {
  const [state, setState] = useState<OrderSheetState>({ phase: "closed" });
  useEffect(() => {
    if (!orderId) {
      setState({ phase: "closed" });
      return;
    }
    setState({ phase: "loading" });
    let current = true;
    loadOrderSheetAction({ id: orderId }).then((result) => {
      if (!current) return;
      setState(result.ok ? { phase: "ready", data: result.value } : { phase: "failed" });
    });
    return () => {
      current = false;
    };
  }, [orderId]);
  return state;
}
