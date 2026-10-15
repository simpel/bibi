import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  ContactListWireSchema,
  ContactWireSchema,
  CustomerListWireSchema,
  CustomerWireSchema,
} from "./wire-schemas";

const customerTable = uiEntry({
  component: "customer-table",
  schema: CustomerListWireSchema,
  toProps: ({ value }) => value,
});
const customerCard = uiEntry({
  component: "customer-card",
  schema: CustomerWireSchema,
  toProps: ({ value }) => ({ customer: value }),
});
const contactTable = uiEntry({
  component: "contact-table",
  schema: ContactListWireSchema,
  toProps: ({ value }) => value,
});
const contactCard = uiEntry({
  component: "contact-card",
  schema: ContactWireSchema,
  toProps: ({ value }) => ({ contact: value }),
});

/** Tool → component for customers and their contact persons (ADR 0022). */
export const CUSTOMER_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  customer_list: customerTable,
  customer_get: customerCard,
  customer_create: customerCard,
  customer_update: customerCard,
  customer_archive: customerCard,
  contact_list: contactTable,
  contact_get: contactCard,
  contact_create: contactCard,
  contact_update: contactCard,
  contact_archive: contactCard,
};
