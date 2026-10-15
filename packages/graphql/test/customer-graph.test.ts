import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const CONTACT = `mutation($i: ContactCreateInput!) { contactCreate(input: $i) { id } }`;

describe("customer graph (ADR 0022)", () => {
  it("resolves customer { contacts { customer } } and the types", async () => {
    const gql = createClient({ context: testContext() });
    const type = async ({ base }: { base: string }) =>
      (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
        .entityTypeCreate.id as string;
    const customerType = await type({ base: "CUSTOMER" });
    const contactType = await type({ base: "CONTACT" });
    const customer = await gql({
      query: CUSTOMER,
      variables: { i: { entityTypeId: customerType, name: "Nordkust Logistik AB" } },
    });
    const customerId = customer.body.data.customerCreate.id;
    for (const name of ["Karin Wallin", "Fakturor Nordkust"]) {
      await gql({
        query: CONTACT,
        variables: { i: { customerId, entityTypeId: contactType, name } },
      });
    }
    const res = await gql({
      query: `query($id: String!) { customer(id: $id) { name entityType { base }
        contacts { name entityType { base } customer { name } } } }`,
      variables: { id: customerId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.customer).toEqual({
      name: "Nordkust Logistik AB",
      entityType: { base: "CUSTOMER" },
      contacts: [
        {
          name: "Fakturor Nordkust",
          entityType: { base: "CONTACT" },
          customer: { name: "Nordkust Logistik AB" },
        },
        {
          name: "Karin Wallin",
          entityType: { base: "CONTACT" },
          customer: { name: "Nordkust Logistik AB" },
        },
      ],
    });
  });
});
