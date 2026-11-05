import { provisionOrganization } from "@bibi/core";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { describe, expect, it } from "vitest";
import { graphContact } from "./graph-contact";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const CUSTOMER = `mutation($i: CustomerCreateInput!) { customerCreate(input: $i) { id } }`;
const ORDER = `mutation($i: OrderCreateInput!) { orderCreate(input: $i) { id } }`;
const ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const LINES =
  "query($id: String!) { order(id: $id) { lines " +
  "{ name entityType { base } state { name hold } } } }";
const ADD = `mutation($i: LineCreateInput!) { lineCreate(input: $i) { id } }`;

describe("line graph (ADR 0022)", () => {
  it("resolves order { lines } and maps a double booking to CONFLICT", async () => {
    const context = testContext();
    expect(
      (
        await provisionOrganization({
          organizationId: context.organizationId,
          timeZone: FALLBACK_TIME_ZONE,
        })
      ).ok,
    ).toBe(true);
    const gql = createClient({ context });
    const type = async ({ base, capabilities }: { base: string; capabilities?: string[] }) =>
      (await gql({ query: TYPE, variables: { i: { base, name: `${base} type`, capabilities } } }))
        .body.data.entityTypeCreate.id as string;
    const customer = await gql({
      query: CUSTOMER,
      variables: { i: { entityTypeId: await type({ base: "CUSTOMER" }), name: "Kvarnby AB" } },
    });
    const period = {
      desiredStartsAt: "2037-11-03T08:00:00.000Z",
      desiredEndsAt: "2037-11-03T16:00:00.000Z",
    };
    const order = await gql({
      query: ORDER,
      variables: {
        i: {
          entityTypeId: await type({ base: "ORDER" }),
          customerId: customer.body.data.customerCreate.id,
          contactId: await graphContact({ gql, customerId: customer.body.data.customerCreate.id }),
          ...period,
        },
      },
    });
    const orderId = order.body.data.orderCreate.id;
    const roomType = await type({ base: "ITEM", capabilities: ["BOOKABLE"] });
    const room = await gql({
      query: ITEM,
      variables: { i: { entityTypeId: roomType, name: "Ek" } },
    });
    const add = {
      orderId,
      entityTypeId: await type({ base: "LINE" }),
      name: "Opening",
      itemId: room.body.data.itemCreate.id,
      startsAt: "2037-11-03T09:00:00.000Z",
      endsAt: "2037-11-03T10:00:00.000Z",
    };
    const created = await gql({ query: ADD, variables: { i: add } });
    expect(created.body.errors).toBeUndefined();
    const clash = await gql({ query: ADD, variables: { i: { ...add, name: "Clash" } } });
    expect(clash.body.errors?.[0]?.extensions?.code).toBe("CONFLICT");
    const res = await gql({
      query: LINES,
      variables: { id: orderId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.order.lines).toEqual([
      // A new item type starts with one hard-holding state (ADR 0044).
      {
        name: "Opening",
        entityType: { base: "LINE" },
        state: { name: "Active", hold: "HARD" },
      },
    ]);
  });
});
