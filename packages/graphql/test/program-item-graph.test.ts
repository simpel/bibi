import { provisionOrganization } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const BOOKING = `mutation($i: BookingCreateInput!) { bookingCreate(input: $i) { id } }`;
const ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const ADD = `mutation($i: ProgramItemCreateInput!) { programItemCreate(input: $i) { id } }`;

describe("program item graph (ADR 0022)", () => {
  it("resolves booking { programItems } and maps a double booking to CONFLICT", async () => {
    const context = testContext();
    expect((await provisionOrganization({ organizationId: context.organizationId })).ok).toBe(true);
    const gql = createClient({ context });
    const type = async ({ base, behaviours }: { base: string; behaviours?: string[] }) =>
      (await gql({ query: TYPE, variables: { i: { base, name: `${base} type`, behaviours } } }))
        .body.data.entityTypeCreate.id as string;
    const customer = await gql({
      query: CUSTOMER,
      variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Kvarnby AB" } },
    });
    const period = { startsAt: "2026-11-03T08:00:00.000Z", endsAt: "2026-11-03T16:00:00.000Z" };
    const booking = await gql({
      query: BOOKING,
      variables: {
        i: {
          entityTypeId: await type({ base: "BOOKING" }),
          customerId: customer.body.data.customerCreate.id,
          ...period,
        },
      },
    });
    const bookingId = booking.body.data.bookingCreate.id;
    const roomType = await type({ base: "ITEM", behaviours: ["BOOKABLE"] });
    const room = await gql({
      query: ITEM,
      variables: { i: { entityTypeId: roomType, name: "Ek" } },
    });
    const add = {
      bookingId,
      entityTypeId: await type({ base: "PROGRAM_ITEM" }),
      name: "Opening",
      itemId: room.body.data.itemCreate.id,
      startsAt: "2026-11-03T09:00:00.000Z",
      endsAt: "2026-11-03T10:00:00.000Z",
    };
    const created = await gql({ query: ADD, variables: { i: add } });
    expect(created.body.errors).toBeUndefined();
    const clash = await gql({ query: ADD, variables: { i: { ...add, name: "Clash" } } });
    expect(clash.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
    const res = await gql({
      query: `query($id: String!) { booking(id: $id) { programItems { name entityType { base } } } }`,
      variables: { id: bookingId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.booking.programItems).toEqual([
      { name: "Opening", entityType: { base: "PROGRAM_ITEM" } },
    ]);
  });
});
