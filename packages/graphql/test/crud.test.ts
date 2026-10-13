import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE_VENUE = `mutation($input: VenueCreateInput!) {
  venueCreate(input: $input) { id name city country status defaultVatRatePercent }
}`;
const CREATE_ROOM = `mutation($input: RoomCreateInput!) {
  roomCreate(input: $input) { id name venueId maxCapacity hasDaylight }
}`;

describe("venue and room CRUD through GraphQL", () => {
  it("creates, lists, gets, updates and archives a venue", async () => {
    const gql = createClient({ context: testContext() });
    const created = await gql({
      query: CREATE_VENUE,
      variables: { input: { name: "Lindholmen", city: "Göteborg" } },
    });
    expect(created.body.errors).toBeUndefined();
    const venue = created.body.data.venueCreate;
    expect(venue).toMatchObject({ name: "Lindholmen", country: "SE", status: "ACTIVE" });

    const list = await gql({ query: "{ venues { items { id name } nextCursor } }" });
    expect(list.body.data.venues.items).toEqual([{ id: venue.id, name: "Lindholmen" }]);
    expect(list.body.data.venues.nextCursor).toBeNull();

    const get = await gql({
      query: "query($id: String!) { venue(id: $id) { name city } }",
      variables: { id: venue.id },
    });
    expect(get.body.data.venue).toEqual({ name: "Lindholmen", city: "Göteborg" });

    const update = `mutation($input: VenueUpdateInput!) { venueUpdate(input: $input) { name city description } }`;
    const updated = await gql({
      query: update,
      variables: { input: { id: venue.id, name: "World of Volvo", city: null } },
    });
    expect(updated.body.data.venueUpdate).toEqual({
      name: "World of Volvo",
      city: null,
      description: null,
    });

    const archive = `mutation($input: VenueArchiveInput!) { venueArchive(input: $input) { status } }`;
    const archived = await gql({ query: archive, variables: { input: { id: venue.id } } });
    expect(archived.body.data.venueArchive.status).toBe("ARCHIVED");
    const after = await gql({ query: "{ venues { items { id } } }" });
    expect(after.body.data.venues.items).toEqual([]);
  });

  it("creates, updates and archives a room", async () => {
    const gql = createClient({ context: testContext() });
    const v = await gql({ query: CREATE_VENUE, variables: { input: { name: "Hus" } } });
    const venueId = v.body.data.venueCreate.id;
    const r = await gql({
      query: CREATE_ROOM,
      variables: { input: { venueId, name: "Salen", maxCapacity: 40 } },
    });
    expect(r.body.data.roomCreate).toMatchObject({
      name: "Salen",
      venueId,
      maxCapacity: 40,
      hasDaylight: false,
    });
    const id = r.body.data.roomCreate.id;

    const rooms = await gql({
      query: "query($venueId: String) { rooms(venueId: $venueId) { items { id } } }",
      variables: { venueId },
    });
    expect(rooms.body.data.rooms.items).toEqual([{ id }]);
    const update = `mutation($input: RoomUpdateInput!) { roomUpdate(input: $input) { name hasDaylight } }`;
    const u = await gql({
      query: update,
      variables: { input: { id, name: "Ljusa salen", hasDaylight: true } },
    });
    expect(u.body.data.roomUpdate).toEqual({ name: "Ljusa salen", hasDaylight: true });
    const archive = `mutation($input: RoomArchiveInput!) { roomArchive(input: $input) { status } }`;
    const a = await gql({ query: archive, variables: { input: { id } } });
    expect(a.body.data.roomArchive.status).toBe("ARCHIVED");
    const gone = await gql({
      query: "query($id: String!) { room(id: $id) { id } }",
      variables: { id },
    });
    expect(gone.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
  });

  it("paginates with cursors", async () => {
    const gql = createClient({ context: testContext() });
    for (const name of ["A", "B", "C"]) {
      await gql({ query: CREATE_VENUE, variables: { input: { name } } });
    }
    const first = await gql({ query: "{ venues(limit: 2) { items { name } nextCursor } }" });
    const { items, nextCursor } = first.body.data.venues;
    expect(items.map((i: { name: string }) => i.name)).toEqual(["A", "B"]);
    const next = await gql({
      query: "query($c: String) { venues(limit: 2, cursor: $c) { items { name } nextCursor } }",
      variables: { c: nextCursor },
    });
    expect(next.body.data.venues).toEqual({ items: [{ name: "C" }], nextCursor: null });
  });
});
