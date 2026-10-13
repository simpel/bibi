import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const SEED = `mutation($v: VenueCreateInput!) { venueCreate(input: $v) { id } }`;
const SEED_ROOM = `mutation($r: RoomCreateInput!) { roomCreate(input: $r) { id } }`;

describe("graph traversal", () => {
  it("resolves venues { rooms } and room { venue }, hiding archived rooms", async () => {
    const gql = createClient({ context: testContext() });
    const v = await gql({ query: SEED, variables: { v: { name: "Gården" } } });
    const venueId = v.body.data.venueCreate.id;
    const names = ["Stora salen", "Ateljén", "Köket"];
    const ids: string[] = [];
    for (const name of names) {
      const r = await gql({ query: SEED_ROOM, variables: { r: { venueId, name } } });
      ids.push(r.body.data.roomCreate.id);
    }
    const archive = `mutation($i: RoomArchiveInput!) { roomArchive(input: $i) { id } }`;
    await gql({ query: archive, variables: { i: { id: ids[2] } } });

    const nested = await gql({
      query: "{ venues { items { name rooms { name venue { name } } } } }",
    });
    expect(nested.body.errors).toBeUndefined();
    const [venue] = nested.body.data.venues.items;
    expect(venue.rooms.map((r: { name: string }) => r.name)).toEqual(["Ateljén", "Stora salen"]);
    expect(venue.rooms[0].venue.name).toBe("Gården");
  });
});
