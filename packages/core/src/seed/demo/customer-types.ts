import type { DemoFieldValues, DemoItem } from "./config-types";

/** A contact person at a demo customer; `type` is the name of one of the org's contact types. */
export type DemoContact = {
  name: string;
  type: string;
  email?: string;
  phone?: string;
  /** The reference this person orders under (ADR 0105). */
  buyerReference?: string;
  fields?: DemoFieldValues;
};

/** A demo customer (slice 4 of ADR 0025); `type` is the name of one of its customer types. */
export type DemoCustomer = {
  name: string;
  type: string;
  /** Business or private (ADR 0106); omitted = BUSINESS. */
  buyerKind?: "BUSINESS" | "PRIVATE";
  organizationNumber?: string;
  /** Invoices must carry the buyer's reference (ADR 0105). */
  requiresBuyerReference?: boolean;
  fields?: DemoFieldValues;
  invoiceCity?: string;
  paymentTermsDays?: number;
  contacts: readonly DemoContact[];
  /** The customer's price list (ADR 0023); a general discount in percent. */
  priceList?: { name: string; discountPercent: number };
  /** Customer-specific bundles (`item.saveAsBundle`), built from catalog items by name. */
  bundles?: readonly DemoItem[];
};
