import { listRestOperationNames } from "@okazi/api";
import { createCoreOperations, listOperations, registerOperations } from "@okazi/core";
import { listGraphqlOperationNames } from "@okazi/graphql";
import { describe, expect, it } from "vitest";
import { listMcpOperationNames, listMcpToolNames } from "../src/list-mcp-tool-names";
import { toToolName } from "../src/tools/tool-name";
import { fakeEmbed } from "./fake-embed";
import { call, connect, type Json, testContext } from "./helpers";
import { gqlRead } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });

/**
 * TODO(apps/web): when apps/web exists, add one entry per UI surface here and assert that every
 * operation has a page/action. Each entry maps a surface name to the operation names it covers.
 */
const WEB_SURFACES: Record<string, () => string[]> = {};

type SurfaceCheck = { surface: string; fix: string; exposed: string[] };

const surfaces = (): SurfaceCheck[] => [
  {
    surface: "REST",
    fix: "add a restRoute in packages/api/src/features/<entity>/rest.ts",
    exposed: listRestOperationNames(),
  },
  {
    surface: "GraphQL",
    fix: "add fieldFromOperation/mutationFromOperation in packages/graphql/src/features/<entity>/graphql.ts",
    exposed: listGraphqlOperationNames(),
  },
  {
    surface: "MCP",
    fix: "add mcpTool({ operation }) in apps/mcp/src/features/<entity>/mcp.ts (or search-mcp.ts)",
    exposed: listMcpOperationNames(),
  },
  ...Object.entries(WEB_SURFACES).map(([surface, list]) => ({
    surface: `web:${surface}`,
    fix: "add the UI action",
    exposed: list(),
  })),
];

describe("surface parity: every core operation exists everywhere", () => {
  for (const { surface, fix, exposed } of surfaces()) {
    it(`${surface} exposes every operation`, () => {
      const missing = listOperations()
        .map((op) => op.name)
        .filter((name) => !exposed.includes(name));
      expect(
        missing,
        `Operations missing from the ${surface} surface: ${missing.join(", ")}. Fix: ${fix}`,
      ).toEqual([]);
    });
  }

  it("MCP tool names are the operation names with underscores and are all served", async () => {
    const client = await connect({ context: testContext() });
    const served = (await client.listTools()).tools.map((tool) => tool.name);
    const expected = listOperations().map((op) => toToolName({ operation: op.name }));
    expect(listMcpToolNames()).toEqual([...expected].sort());
    const missing = expected.filter((name) => !served.includes(name));
    expect(missing, `MCP tools/list is missing: ${missing.join(", ")}`).toEqual([]);
  });
});

type Entity = {
  name: string;
  create: Record<string, unknown>;
  field: string;
  list: string;
  get: string;
};

/** Entity types and how to create one; add a row when a new entity gets core operations. */
const ENTITIES: Entity[] = [
  {
    name: "venue",
    create: { name: "Parity Hall" },
    field: "venue",
    list: "venues",
    get: "venue_get",
  },
  {
    name: "room",
    create: { name: "Parity Room", maxCapacity: 12 },
    field: "room",
    list: "rooms",
    get: "room_get",
  },
];

/** GraphQL deliberately hides `organizationId` (the graph is org-scoped); compare without it. */
function withoutOrg({ value }: { value: Json }): Json {
  const { organizationId: _organizationId, ...rest } = value;
  return rest;
}

function coreEntityTypes(): string[] {
  return [
    ...new Set(
      listOperations()
        .map((op) => op.entityType)
        .filter((type) => type !== "search"),
    ),
  ].sort();
}

describe("entity read parity: core -> GraphQL, REST, MCP return equal data", () => {
  it("covers every core entity type", () => {
    expect(
      ENTITIES.map((entity) => entity.name).sort(),
      "Add the new entity to ENTITIES in parity.test.ts",
    ).toEqual(coreEntityTypes());
  });

  it("reads a created venue and room identically through all surfaces", async () => {
    const context = testContext();
    const mcp = await connect({ context });
    const rest = createRestClient({ context });
    const venue = (await call({ client: mcp, name: "venue_create", args: ENTITIES[0]?.create }))
      .data;
    const room = (
      await call({
        client: mcp,
        name: "room_create",
        args: { ...ENTITIES[1]?.create, venueId: venue.id },
      })
    ).data;
    for (const [entity, created] of [
      [ENTITIES[0], venue],
      [ENTITIES[1], room],
    ] as [Entity, Json][]) {
      const viaMcp = (await call({ client: mcp, name: entity.get, args: { id: created.id } })).data;
      const viaRest = await rest.get({ path: `/${entity.list}/${created.id}` });
      const keys = Object.keys(created).filter((key) => key !== "organizationId");
      const viaGraph = await gqlRead({ context, entity: entity.field, id: created.id, keys });
      const labels = `${entity.name}: MCP vs REST vs GraphQL`;
      expect(viaMcp, `${labels} (MCP)`).toEqual(created);
      expect(withoutOrg({ value: viaRest }), `${labels} (REST)`).toEqual(
        withoutOrg({ value: created }),
      );
      expect(viaGraph, `${labels} (GraphQL)`).toEqual(withoutOrg({ value: created }));
    }
  });
});
