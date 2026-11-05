import { provisionOrganization } from "@bibi/core";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { graphContact } from "./graph-contact";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const ORDER = `mutation($i: OrderCreateInput!) { orderCreate(input: $i) { id reference } }`;
const ASSIGN = `mutation($i: AssignmentAssignInput!) { assignmentAssign(input: $i) { id } }`;

describe("order graph (ADR 0043)", () => {
  it("resolves order { customer orderStatus entityType } and customer { orders }", async () => {
    const context = testContext();
    const provisioned = await provisionOrganization({
      organizationId: context.organizationId,
      timeZone: FALLBACK_TIME_ZONE,
    });
    expect(provisioned.ok).toBe(true);
    const gql = createClient({ context });
    const type = async ({ base }: { base: string }) =>
      (await gql({ query: TYPE, variables: { i: { base, name: `${base} type` } } })).body.data
        .entityTypeCreate.id as string;
    const customer = await gql({
      query: CUSTOMER,
      variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Kvarnby AB" } },
    });
    const customerId = customer.body.data.customerCreate.id;
    const created = await gql({
      query: ORDER,
      variables: {
        i: {
          entityTypeId: await type({ base: "ORDER" }),
          customerId,
          contactId: await graphContact({ gql, customerId }),
          desiredStartsAt: "2037-11-03T08:00:00.000Z",
          desiredEndsAt: "2037-11-03T16:00:00.000Z",
          estimatedHeadcount: 18,
        },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const { id, reference } = created.body.data.orderCreate;
    expect(reference).toBe(1);
    const res = await gql({
      query: `query($id: String!) { order(id: $id) { estimatedHeadcount entityType { base }
        orderStatus { name entry } customer { name orders { id } } } }`,
      variables: { id },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.order).toEqual({
      estimatedHeadcount: 18,
      entityType: { base: "ORDER" },
      orderStatus: { name: "Lead", entry: true },
      customer: { name: "Kvarnby AB", orders: [{ id }] },
    });
    const subject = { subjectType: "ORDER", subjectId: id };
    const stranger = await gql({
      query: ASSIGN,
      variables: { i: { ...subject, assigneeId: "x" } },
    });
    expect(stranger.body.errors?.[0]?.extensions?.code).toBe("VALIDATION");
    const unassigned = await gql({
      query: `query($id: String!) { order(id: $id) { assignments { assigneeId } } }`,
      variables: { id },
    });
    expect(unassigned.body.data.order.assignments).toEqual([]);
  });
});
