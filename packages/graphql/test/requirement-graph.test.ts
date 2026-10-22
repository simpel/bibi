import { provisionOrganization } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const TICKET = `mutation($i: TicketCreateInput!) { ticketCreate(input: $i) { id } }`;
const LIST = `mutation($i: VocabularyCreateInput!) { vocabularyCreate(input: $i) { values { id } } }`;
const ADD = `mutation($i: RequirementCreateInput!) { requirementCreate(input: $i) { id } }`;
const READ =
  "query($id: String!) { ticket(id: $id) { requirements { quantity lineId vocabularyValue { name } } } }";

type Gql = ReturnType<typeof createClient>;

async function ticketWithList({ gql }: { gql: Gql }) {
  const type = async ({ base }: { base: string }) =>
    (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
      .entityTypeCreate.id as string;
  const customer = await gql({
    query: CUSTOMER,
    variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Kvarnby AB" } },
  });
  const ticket = await gql({
    query: TICKET,
    variables: {
      i: {
        entityTypeId: await type({ base: "TICKET" }),
        customerId: customer.body.data.customerCreate.id,
        desiredStartsAt: "2026-11-03T08:00:00.000Z",
        desiredEndsAt: "2026-11-03T16:00:00.000Z",
      },
    },
  });
  const list = await gql({
    query: LIST,
    variables: { i: { name: "Allergens", values: ["Gluten"] } },
  });
  return {
    ticketId: ticket.body.data.ticketCreate.id as string,
    entityTypeId: await type({ base: "REQUIREMENT" }),
    vocabularyValueId: list.body.data.vocabularyCreate.values[0].id as string,
  };
}

describe("requirement graph (ADR 0021)", () => {
  it("resolves ticket { requirements { vocabularyValue } } and maps a duplicate to CONFLICT", async () => {
    const context = testContext();
    expect((await provisionOrganization({ organizationId: context.organizationId })).ok).toBe(true);
    const gql = createClient({ context });
    const add = { ...(await ticketWithList({ gql })), quantity: 3 };
    const created = await gql({ query: ADD, variables: { i: add } });
    expect(created.body.errors).toBeUndefined();
    const twice = await gql({ query: ADD, variables: { i: add } });
    expect(twice.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
    const res = await gql({ query: READ, variables: { id: add.ticketId } });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.ticket.requirements).toEqual([
      { quantity: 3, lineId: null, vocabularyValue: { name: "Gluten" } },
    ]);
  });
});
