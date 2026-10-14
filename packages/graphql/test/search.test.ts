import { listOperations } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { listGraphqlOperationNames, printSchemaSdl } from "../src/index";
import { createClient, createItemType, testContext } from "./helpers";

describe("search and parity", () => {
  it("returns hits with resolvable entities (union)", async () => {
    const gql = createClient({ context: testContext() });
    const v = `mutation($i: VenueCreateInput!) { venueCreate(input: $i) { id } }`;
    const venue = await gql({
      query: v,
      variables: { i: { name: "Lindholmen konferens", description: "Havsutsikt" } },
    });
    const item = `mutation($i: ItemCreateInput!) { itemCreate(input: $i) { id } }`;
    const entityTypeId = await createItemType({ gql });
    await gql({
      query: item,
      variables: {
        i: {
          entityTypeId,
          venueId: venue.body.data.venueCreate.id,
          name: "Ljusa salen",
          description: "Konferensrum med dagsljus",
        },
      },
    });
    const query = `query($q: String!) { search(query: $q) { hits {
      entityType entityId score entity { __typename ... on Venue { name } ... on Item { name venue { name } } }
    } } }`;
    const res = await gql({ query, variables: { q: "dagsljus konferensrum" } });
    expect(res.body.errors).toBeUndefined();
    const hits = res.body.data.search.hits;
    const itemHit = hits.find((h: { entityType: string }) => h.entityType === "item");
    expect(itemHit.entity).toEqual({
      __typename: "Item",
      name: "Ljusa salen",
      venue: { name: "Lindholmen konferens" },
    });
    expect(typeof itemHit.score).toBe("number");
  });

  it("exposes every core operation exactly once", () => {
    const registered = listOperations().map((op) => op.name);
    expect(listGraphqlOperationNames()).toEqual([...registered].sort());
  });

  it("prints the SDL with the graph relations", () => {
    const sdl = printSchemaSdl();
    expect(sdl).toContain("type Venue");
    expect(sdl).toContain("limit: Int = 50");
    expect(sdl).toContain("union SearchEntity = Conversation | Item | Skill | Venue");
  });
});
