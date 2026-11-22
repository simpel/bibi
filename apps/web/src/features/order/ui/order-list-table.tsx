import type { OrderCue, OrderDto } from "@bibi/core";
import type { OrderFormData } from "./order-form-data";
import { OrderTable, type OrderTablePage } from "./order-table";

export type OrderListTableProps = {
  orders: OrderDto[];
  total: number;
  view: OrderTablePage;
  data: OrderFormData;
  /** Card cues by order id (preliminary, flags); missing = none. */
  cues: Readonly<Record<string, OrderCue>>;
};

/** Hands the client table only what it shows (plain lookups, no form schemas or Maps). */
export function OrderListTable({ orders, total, view, data, cues }: OrderListTableProps) {
  return (
    <OrderTable
      orders={orders}
      total={total}
      view={view}
      cues={cues}
      customers={data.customers}
      customersHidden={data.customersHidden}
      types={data.types.map(({ id, name }) => ({ id, name }))}
      statuses={data.statuses}
      members={data.members}
    />
  );
}
