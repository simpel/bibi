import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { byId, type ParityEntity, tool } from "./parity-entities";

type TypeInput = { mcp: Client; base: "CUSTOMER" | "CONTACT"; name: string };

/** A type of the base with one TEXT field; returns its id. */
async function typeWithField({ mcp, base, name }: TypeInput): Promise<string> {
  const type = await tool({ mcp, name: "entityType_create", args: { base, name } });
  const args = { entityTypeId: type.id, name: "Reference", key: "reference", kind: "TEXT" };
  await tool({ mcp, name: "fieldDefinition_create", args });
  return type.id;
}

const customer: ParityEntity = {
  ...byId({ name: "customer", field: "customer", list: "customers", createTool: "", args: {} }),
  create: async ({ mcp }) =>
    tool({
      mcp,
      name: "customer_create",
      args: {
        entityTypeId: await typeWithField({ mcp, base: "CUSTOMER", name: "Parity company" }),
        name: "Parity AB",
        email: "billing@parity.test",
        invoiceCity: "Göteborg",
        paymentTermsDays: 30,
        fields: { reference: "556677-8899" },
      },
    }),
};

const contact: ParityEntity = {
  ...byId({ name: "contact", field: "contact", list: "contacts", createTool: "", args: {} }),
  create: async ({ mcp, made }) =>
    tool({
      mcp,
      name: "contact_create",
      args: {
        customerId: made.customer.id,
        entityTypeId: await typeWithField({ mcp, base: "CONTACT", name: "Parity person" }),
        name: "Karin Parity",
        phone: "070-1234567",
        fields: { reference: "Orderer" },
      },
    }),
};

const priceList: ParityEntity = byId({
  name: "priceList",
  field: "priceList",
  list: "price-lists",
  createTool: "priceList_create",
  args: {},
  nested: { items: "{ itemId priceMinor }" },
});

/** Customers, their contact persons (ADR 0022) and their price lists (ADR 0023). */
export function customerEntities(): ParityEntity[] {
  return [
    customer,
    contact,
    {
      ...priceList,
      create: ({ mcp, made }) =>
        tool({
          mcp,
          name: "priceList_create",
          args: {
            name: "Nordkust framework agreement −15 %",
            customerId: made.customer.id,
            validFrom: "2026-01-01",
            validTo: "2026-12-31",
            discountPercent: 15,
          },
        }),
    },
  ];
}
