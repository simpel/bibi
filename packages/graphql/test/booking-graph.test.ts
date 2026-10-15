import { provisionOrganization } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const BOOKING = `mutation($i: BookingCreateInput!) { bookingCreate(input: $i) { id reference } }`;
const ASSIGN = `mutation($i: BookingAssignInput!) { bookingAssign(input: $i) { id } }`;

describe("booking graph (ADR 0022)", () => {
  it("resolves booking { customer bookingStatus entityType } and customer { bookings }", async () => {
    const context = testContext();
    const provisioned = await provisionOrganization({ organizationId: context.organizationId });
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
      query: BOOKING,
      variables: {
        i: {
          entityTypeId: await type({ base: "BOOKING" }),
          customerId,
          startsAt: "2026-11-03T08:00:00.000Z",
          endsAt: "2026-11-03T16:00:00.000Z",
          estimatedHeadcount: 18,
        },
      },
    });
    expect(created.body.errors).toBeUndefined();
    const { id, reference } = created.body.data.bookingCreate;
    expect(reference).toBe(1);
    const res = await gql({
      query: `query($id: String!) { booking(id: $id) { estimatedHeadcount entityType { base }
        bookingStatus { phase } customer { name bookings { id } } } }`,
      variables: { id },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.booking).toEqual({
      estimatedHeadcount: 18,
      entityType: { base: "BOOKING" },
      bookingStatus: { phase: "TENTATIVE" },
      customer: { name: "Kvarnby AB", bookings: [{ id }] },
    });
    const stranger = await gql({ query: ASSIGN, variables: { i: { id, salesOwnerId: "nobody" } } });
    expect(stranger.body.errors?.[0]?.extensions?.code).toBe("VALIDATION");
  });
});
