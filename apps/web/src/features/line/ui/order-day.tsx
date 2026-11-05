import type { LineDto } from "@bibi/core";
import { loadOrderDays } from "../order-days";
import { OrderDayList } from "./order-day-list";
import type { ProgramFormData } from "./program-form-data";

export type OrderDayProps = {
  orderId: string;
  orderReference?: number | null;
  customerName?: string | null;
  lines: LineDto[];
  data: ProgramFormData;
  /** Drawn inside a card shared with the table below, without its own border. */
  joined?: boolean;
};

/**
 * The order's days in the calendar: per day, everything booked in the organization, the other
 * orders' dimmed and this order's lines solid (the intake's snapshot, ADR 0081).
 */
export async function OrderDay({
  orderId,
  orderReference,
  customerName,
  lines,
  data,
  joined,
}: OrderDayProps) {
  const days = await loadOrderDays({ orderId, orderReference, customerName, lines, data });
  return <OrderDayList {...days} joined={joined} />;
}
