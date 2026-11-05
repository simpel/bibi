import { orderName } from "@/lib/order-label";

export type OrderLabelInput = {
  reference: number;
  title: string | null;
  customerName: string | null;
  /** `dashboard.order` and `dashboard.orderCustomer`. */
  label: (values: { reference: number }) => string;
  withCustomer: (values: { reference: number; customer: string }) => string;
  /** `dashboard.orderTitleCustomer`. */
  titleWithCustomer: (values: { title: string; customer: string }) => string;
};

/** "Title · Customer", or "#12 · Customer" without a title; no customer without `customer:read`. */
export function orderLabel({
  reference,
  title,
  customerName,
  label,
  withCustomer,
  titleWithCustomer,
}: OrderLabelInput) {
  if (customerName === null) return orderName({ title, fallback: label({ reference }) });
  return title === null
    ? withCustomer({ reference, customer: customerName })
    : titleWithCustomer({ title, customer: customerName });
}
