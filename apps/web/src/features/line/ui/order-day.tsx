import type { LineDto } from "@bibi/core";
import type { OrderComments } from "@/features/comment/ui/comment-view";
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
  /** The order's comments, for each bar's comment icon (ADR 0115). */
  comments?: OrderComments | null;
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
  comments,
}: OrderDayProps) {
  const days = await loadOrderDays({ orderId, orderReference, customerName, lines, data });
  return <OrderDayList {...days} joined={joined} comments={comments} />;
}
