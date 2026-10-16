import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const TYPE = `mutation($i: EntityTypeCreateInput!) { entityTypeCreate(input: $i) { id } }`;
const ITEM = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
const PLACE = `mutation($i: OptionCreateInput!) { optionCreate(input: $i) { id rank } }`;
const RELEASE = `mutation($i: OptionReleaseInput!) { optionRelease(input: $i) { optionStatus } }`;

describe("option graph (ADR 0022)", () => {
  it("queues options on item { options } and moves the queue up on release", async () => {
    const gql = createClient({ context: testContext() });
    const type = await gql({
      query: TYPE,
      variables: { i: { base: "ITEM", name: "Room", behaviours: ["BOOKABLE"] } },
    });
    const entityTypeId = type.body.data.entityTypeCreate.id;
    const item = await gql({ query: ITEM, variables: { i: { entityTypeId, name: "Älvsalen" } } });
    const itemId = item.body.data.itemCreate.id;
    const option = {
      itemId,
      startsAt: "2026-11-01T08:00:00.000Z",
      endsAt: "2026-11-01T12:00:00.000Z",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    };
    const first = await gql({ query: PLACE, variables: { i: option } });
    const second = await gql({ query: PLACE, variables: { i: option } });
    expect([first.body.data.optionCreate.rank, second.body.data.optionCreate.rank]).toEqual([1, 2]);
    const released = await gql({
      query: RELEASE,
      variables: { i: { id: first.body.data.optionCreate.id } },
    });
    expect(released.body.errors).toBeUndefined();
    const res = await gql({
      query: `query($id: String!) { item(id: $id) { options { rank optionStatus } } }`,
      variables: { id: itemId },
    });
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.item.options).toEqual([
      { rank: 1, optionStatus: "ACTIVE" },
      { rank: null, optionStatus: "RELEASED" },
    ]);
  });
});
