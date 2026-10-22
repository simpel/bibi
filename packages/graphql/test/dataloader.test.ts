import { createExecuteContext, type ExecuteContext } from "@bibi/core";
import { type Db, getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { createClient, createItemType, testContext } from "./helpers";

/** Same caller as `context`, but every model query on its org-scoped db is counted. */
function withQueryCount({ context }: { context: ExecuteContext }) {
  const counter = { count: 0 };
  const db = getDb().$extends({
    query: {
      $allModels: {
        $allOperations({
          args,
          query,
        }: {
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }) {
          counter.count += 1;
          return query(args);
        },
      },
    },
  }) as unknown as Db;
  const { db: _scoped, ...rest } = context;
  return { counter, context: createExecuteContext({ ...rest, db }) };
}

const SEED_VENUE = `mutation($v: VenueCreateInput!) { venueCreate(input: $v) { id } }`;
const SEED_ITEM = `mutation($r: ItemCreateInput!) { itemCreate(input: $r) { id } }`;
const LIST = "{ items(limit: 100) { items { name venue { name } entityType { name } } } }";

async function countQueries({ itemCount }: { itemCount: number }) {
  const base = testContext();
  const seed = createClient({ context: base });
  const venues = [];
  for (const name of ["A", "B"]) {
    const v = await seed({ query: SEED_VENUE, variables: { v: { name } } });
    venues.push(v.body.data.venueCreate.id as string);
  }
  const entityTypeId = await createItemType({ gql: seed });
  for (let i = 0; i < itemCount; i++) {
    const venueId = venues[i % 2];
    await seed({
      query: SEED_ITEM,
      variables: { r: { entityTypeId, venueId, name: `Item ${i}` } },
    });
  }
  const { counter, context } = withQueryCount({ context: base });
  const res = await createClient({ context })({ query: LIST });
  expect(res.body.errors).toBeUndefined();
  expect(res.body.data.items.items).toHaveLength(itemCount);
  expect(res.body.data.items.items[0].venue.name).toBeDefined();
  return counter.count;
}

describe("graph edge dataloaders", () => {
  it("resolves Item.venue and Item.entityType with a constant number of queries", async () => {
    const small = await countQueries({ itemCount: 4 });
    const large = await countQueries({ itemCount: 50 });
    expect(large).toBe(small);
  });
});
