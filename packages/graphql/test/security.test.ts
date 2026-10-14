import { grantAll } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { createClient, testContext } from "./helpers";

const CREATE = `mutation($i: VenueCreateInput!) { venueCreate(input: $i) { id } }`;
const DEEP =
  "{ venues { items { rooms { venue { rooms { venue { rooms { venue { rooms { venue { rooms { venue { rooms { id } } } } } } } } } } } } } }";

describe("scoping, errors and limits", () => {
  it("isolates organizations through queries, graph and mutations", async () => {
    const a = createClient({ context: testContext() });
    const b = createClient({ context: testContext() });
    const created = await a({ query: CREATE, variables: { i: { name: "Hemligt" } } });
    const id = created.body.data.venueCreate.id;
    const list = await b({ query: "{ venues { items { id } } }" });
    expect(list.body.data.venues.items).toEqual([]);
    const get = await b({
      query: "query($id: String!) { venue(id: $id) { id } }",
      variables: { id },
    });
    expect(get.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    const update = `mutation($i: VenueUpdateInput!) { venueUpdate(input: $i) { id } }`;
    const hijack = await b({ query: update, variables: { i: { id, name: "Mitt" } } });
    expect(hijack.body.errors?.[0]?.extensions.code).toBe("NOT_FOUND");
    const room = `mutation($i: RoomCreateInput!) { roomCreate(input: $i) { id } }`;
    const cross = await b({ query: room, variables: { i: { venueId: id, name: "X" } } });
    expect(cross.body.errors?.[0]?.extensions.code).toBe("VALIDATION");
  });

  it("returns core validation issues in extensions", async () => {
    const gql = createClient({ context: testContext() });
    const res = await gql({
      query: CREATE,
      variables: { i: { name: "   ", contactEmail: "nope" } },
    });
    const [error] = res.body.errors ?? [];
    expect(error?.extensions.code).toBe("VALIDATION");
    expect(error?.extensions.httpStatus).toBe(400);
    const paths = error?.extensions.issues.map((i: { path: string }) => i.path);
    expect(paths).toEqual(expect.arrayContaining(["name", "contactEmail"]));
  });

  it("rejects GraphQL-level type errors before core runs", async () => {
    const gql = createClient({ context: testContext() });
    const res = await gql({ query: CREATE, variables: { i: { name: 5 } } });
    expect(res.body.errors?.length).toBeGreaterThan(0);
  });

  it("enforces permissions: viewer can read but not write", async () => {
    const owner = testContext();
    const viewer = createClient({ context: { ...owner, permissions: grantAll({ upTo: "read" }) } });
    const write = await viewer({ query: CREATE, variables: { i: { name: "Nej" } } });
    expect(write.body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
    const read = await viewer({ query: "{ venues { items { id } } }" });
    expect(read.body.errors).toBeUndefined();
  });

  it("answers unauthenticated callers with 401", async () => {
    const gql = createClient();
    const res = await gql({ query: "{ venues { items { id } } }" });
    expect(res.status).toBe(401);
    expect(res.body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
  });

  it("rejects queries deeper than the depth limit", async () => {
    const gql = createClient({ context: testContext() });
    const res = await gql({ query: DEEP });
    expect(res.body.errors?.[0]?.message).toMatch(/depth/i);
    expect(res.body.data).toBeUndefined();
  });

  it("rejects queries whose estimated cost is too high", async () => {
    const gql = createClient({ context: testContext() });
    const query =
      "{ venues(limit: 100) { items { rooms(limit: 100) { venue { rooms(limit: 100) { name } } } } } }";
    const res = await gql({ query });
    expect(res.body.errors?.[0]?.message).toMatch(/cost/i);
  });

  it("allows introspection in development only", async () => {
    const dev = createClient({ context: testContext(), development: true });
    const prod = createClient({ context: testContext() });
    const query = "{ __schema { queryType { name } } }";
    expect((await dev({ query })).body.data.__schema.queryType.name).toBe("Query");
    expect((await prod({ query })).body.errors?.length).toBeGreaterThan(0);
  });
});
