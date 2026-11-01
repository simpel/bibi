export type TicketLabelInput = {
  reference: number;
  customerName: string | null;
  /** `dashboard.ticket` and `dashboard.ticketCustomer`. */
  label: (values: { reference: number }) => string;
  withCustomer: (values: { reference: number; customer: string }) => string;
};

/** "#12 · Customer", or "#12" without `customer:read`. */
export function ticketLabel({ reference, customerName, label, withCustomer }: TicketLabelInput) {
  return customerName === null
    ? label({ reference })
    : withCustomer({ reference, customer: customerName });
}
