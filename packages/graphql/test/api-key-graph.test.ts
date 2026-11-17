import { grantAll } from "@bibi/core";
import { createId } from "@paralleldrive/cuid2";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const CONTACT = `mutation($i: ContactCreateInput!) { contactCreate(input: $i) { id } }`;
const READ = `query($id: String!) { customer(id: $id) { name contacts { name customer { name } } } }`;
const TYPED = `query($id: String!) { customer(id: $id) { name entityType { base } } }`;

type Gql = ReturnType<typeof createClient>;

async function seedCustomer({ gql }: { gql: Gql }): Promise<string> {
  const type = async ({ base }: { base: string }) =>
    (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
      .entityTypeCreate.id as string;
  const customer = await gql({
    query: CUSTOMER,
    variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Nordkust AB" } },
  });
  const customerId = customer.body.data.customerCreate.id as string;
  const entityTypeId = await type({ base: "CONTACT" });
  await gql({ query: CONTACT, variables: { i: { customerId, entityTypeId, name: "Anna Berg" } } });
  return customerId;
}

/** An API key has no user (ADR 0050): gated edges check its permissions like core does. */
describe("gated graph edges for an API key", () => {
  const organizationId = `org_${createId()}`;
  const keyClient = ({ features }: { features: Parameters<typeof grantAll>[0]["features"] }) =>
    createClient({
      context: testContext({
        organizationId,
        permissions: grantAll({ features, only: "read" }),
        actor: { type: "apiKey", userId: null, apiKeyId: `key_${createId()}` },
      }),
    });

  let customerId = "";
  beforeAll(async () => {
    const admin = createClient({ context: testContext({ organizationId }) });
    customerId = await seedCustomer({ gql: admin });
  });

  it("resolves contact.customer for a key with customer:read", async () => {
    const res = await keyClient({ features: ["customer"] })({
      query: READ,
      variables: { id: customerId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.customer.contacts).toEqual([
      { name: "Anna Berg", customer: { name: "Nordkust AB" } },
    ]);
  });

  it("refuses an edge whose permission the key lacks with FORBIDDEN", async () => {
    const res = await keyClient({ features: ["customer"] })({
      query: TYPED,
      variables: { id: customerId },
    });
    expect(res.body.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
  });
});
