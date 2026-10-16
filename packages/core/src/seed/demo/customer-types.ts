import type { DemoFieldValues } from "./config-types";

/** A contact person at a demo customer; `type` is the name of one of the org's contact types. */
export type DemoContact = {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  fields?: DemoFieldValues;
};

/** A demo customer (slice 4 of ADR 0025); `type` is the name of one of its customer types. */
export type DemoCustomer = {
  name: string;
  type: string;
  fields?: DemoFieldValues;
  invoiceCity?: string;
  paymentTermsDays?: number;
  contacts: readonly DemoContact[];
  /** The customer's price list (ADR 0023); a general discount in percent. */
  priceList?: { name: string; discountPercent: number };
};
