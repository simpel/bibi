import { OrderCardView } from "./order-card-view";
import { OrderEstimateHistoryView } from "./order-estimate-history-view";
import { OrderStatusHistoryView } from "./order-status-history-view";
import { OrderTableView } from "./order-table-view";
import { OrderViewView } from "./order-view-view";

/** The order's own cards: list, card and its histories (ADR 0054, 0074), part of `GENERATIVE_COMPONENTS`. */
export const ORDER_COMPONENTS = {
  "order-table": OrderTableView,
  "order-card": OrderCardView,
  "order-view": OrderViewView,
  "order-status-history": OrderStatusHistoryView,
  "order-estimate-history": OrderEstimateHistoryView,
} as const;
