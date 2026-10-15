import type { DemoCustomer } from "../../customer-types";

const contact = ({ name }: { name: string }) => ({ name, type: "Contact person" });

/**
 * Vingaleden's customers (`docs/demo-seed.md`). Hisingen Energi AB and Kvarnby Design AB have
 * the same names as at Lindholmen but are completely separate rows in another organization.
 */
export const vingaledenCustomers: readonly DemoCustomer[] = [
  {
    name: "Hisingen Energi AB",
    type: "Company",
    fields: { "Org no.": "556834-2210" },
    contacts: [contact({ name: "Mats Olsson" })],
  },
  { name: "Familjen Rask", type: "Private", contacts: [contact({ name: "Johan Rask" })] },
  {
    name: "Kvarnby Design AB",
    type: "Company",
    fields: { "Org no.": "559012-7788" },
    contacts: [contact({ name: "Linnea Kvist" })],
  },
];
