import { provisionOrganization } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const TICKET = `mutation($i: TicketCreateInput!) { ticketCreate(input: $i) { id } }`;
const ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const LINES =
  "query($id: String!) { ticket(id: $id) { lines " +
  "{ name entityType { base } state { name hold } } } }";
const ADD = `mutation($i: LineCreateInput!) { lineCreate(input: $i) { id } }`;

describe("line graph (ADR 0022)", () => {
  it("resolves ticket { lines } and maps a double booking to CONFLICT", async () => {
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
    const period = {
      desiredStartsAt: "2026-11-03T08:00:00.000Z",
      desiredEndsAt: "2026-11-03T16:00:00.000Z",
    };
    const ticket = await gql({
      query: TICKET,
      variables: {
        i: {
          entityTypeId: await type({ base: "TICKET" }),
          customerId: customer.body.data.customerCreate.id,
          ...period,
        },
      },
    });
    const ticketId = ticket.body.data.ticketCreate.id;
    const roomType = await type({ base: "ITEM", behaviours: ["BOOKABLE"] });
    const room = await gql({
      query: ITEM,
      variables: { i: { entityTypeId: roomType, name: "Ek" } },
    });
    const add = {
      ticketId,
      entityTypeId: await type({ base: "LINE" }),
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
      query: LINES,
      variables: { id: ticketId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.ticket.lines).toEqual([
      // A new item type starts with one hard-holding state (ADR 0044).
      {
        name: "Opening",
        entityType: { base: "LINE" },
        state: { name: "Active", hold: "HARD" },
      },
    ]);
  });
});
