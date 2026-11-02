import { ticketName } from "@/lib/ticket-label";

export type TicketLabelInput = {
  reference: number;
  title: string | null;
  customerName: string | null;
  /** `dashboard.ticket` and `dashboard.ticketCustomer`. */
  label: (values: { reference: number }) => string;
  withCustomer: (values: { reference: number; customer: string }) => string;
  /** `dashboard.ticketTitleCustomer`. */
  titleWithCustomer: (values: { title: string; customer: string }) => string;
};

/** "Title · Customer", or "#12 · Customer" without a title; no customer without `customer:read`. */
export function ticketLabel({
  reference,
  title,
  customerName,
  label,
  withCustomer,
  titleWithCustomer,
}: TicketLabelInput) {
  if (customerName === null) return ticketName({ title, fallback: label({ reference }) });
  return title === null
    ? withCustomer({ reference, customer: customerName })
    : titleWithCustomer({ title, customer: customerName });
}
