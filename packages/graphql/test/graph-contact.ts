import type { createClient } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CONTACT = `mutation($i: ContactCreateInput!) { contactCreate(input: $i) { id } }`;

export type GraphContactInput = { gql: ReturnType<typeof createClient>; customerId: string };

/** A contact (with its own contact type) at the customer; returns the contact id. */
export async function graphContact({ gql, customerId }: GraphContactInput): Promise<string> {
  const type = await gql({ query: TYPE, variables: { i: { base: "CONTACT", name: "Contact" } } });
  const entityTypeId = type.body.data.entityTypeCreate.id as string;
  const contact = await gql({
    query: CONTACT,
    variables: { i: { entityTypeId, customerId, name: "Anna Berg" } },
  });
  return contact.body.data.contactCreate.id as string;
}
