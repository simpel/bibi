import { listRestOperationNames } from "@bibi/api";
import { createCoreOperations, listOperations, registerOperations } from "@bibi/core";
import { listGraphqlOperationNames } from "@bibi/graphql";
import { describe, expect, it } from "vitest";
import { listMcpOperationNames, listMcpToolNames } from "../src/list-mcp-tool-names";
import { toToolName } from "../src/tools/tool-name";
import { fakeEmbed } from "./fake-embed";
import { connect, type Json, testContext } from "./helpers";
import { ENTITIES } from "./parity-entities";
import { seedOrgMember } from "./seed-org-member";

registerOperations({ operations: createCoreOperations({ embed: fakeEmbed }) });

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

  it("hides exactly the aiAllowed: false operations from the AI actor (#88)", async () => {
    const actor = { type: "ai", userId: "user_ai", conversationId: "c" } as const;
    const client = await connect({ context: testContext({ actor }) });
    const served = (await client.listTools()).tools.map((tool) => tool.name);
    const hidden = listOperations()
      .map((op) => toToolName({ operation: op.name }))
      .filter((name) => !served.includes(name));
    const forbidden = listOperations().filter((op) => !op.aiAllowed);
    expect(hidden).toEqual(forbidden.map((op) => toToolName({ operation: op.name })));
    expect(hidden).toContain("apiKey_create");
  });
});

/**
 * GraphQL deliberately hides `organizationId` (the graph is org-scoped); compare without it,
 * also in nested objects such as a type's fields.
 */
function withoutOrg({ value }: { value: Json }): Json {
  if (Array.isArray(value)) return value.map((entry) => withoutOrg({ value: entry }));
  if (value === null || typeof value !== "object") return value;
  const { organizationId: _organizationId, ...rest } = value;
  return Object.fromEntries(
    Object.entries(rest).map(([key, entry]) => [key, withoutOrg({ value: entry as Json })]),
  );
}

/**
 * Read-only views over other entities, the guided pipeline setup (a preview and a batch of other
 * entities' commands) and change sets (a batch of other commands, ADR 0049): no rows of their own
 * to create and read back through each surface.
 */
const VIEWS = new Set(["search", "pipeline", "pipelineSetup", "changeSet"]);

function coreEntityTypes(): string[] {
  return [
    ...new Set(
      listOperations()
        .map((op) => op.entityType)
        .filter((type) => !VIEWS.has(type)),
    ),
  ].sort();
}

describe("entity read parity: core -> GraphQL, REST, MCP return equal data", () => {
  it("covers every core entity type", () => {
    expect(
      ENTITIES.map((entity) => entity.name).sort(),
      "Add the new entity to ENTITIES in parity-entities.ts",
    ).toEqual(coreEntityTypes());
  });

  it("reads every created entity identically through all surfaces", async () => {
    const context = testContext();
    const mcp = await connect({ context });
    const made: Record<string, Json> = { memberSeed: await seedOrgMember({ context }) };
    for (const entity of ENTITIES) {
      const created = await entity.create({ mcp, made, context });
      // Singletons without an id (a file's key, a user's working days) are told apart by those.
      const identity = created?.id ?? created?.subjectId ?? created?.key ?? created?.days;
      expect(identity, `${entity.name}: create via MCP`).toBeTruthy();
      made[entity.name] = created;
      const keys = Object.keys(created).filter((key) => key !== "organizationId");
      const input = { context, mcp, created, keys };
      const labels = `${entity.name}: MCP vs REST vs GraphQL`;
      expect(await entity.viaMcp(input), `${labels} (MCP)`).toEqual(created);
      expect(withoutOrg({ value: await entity.viaRest(input) }), `${labels} (REST)`).toEqual(
        withoutOrg({ value: created }),
      );
      // Both sides: JSON values (audit before/after images) keep their nested organizationId.
      expect(withoutOrg({ value: await entity.viaGraph(input) }), `${labels} (GraphQL)`).toEqual(
        withoutOrg({ value: created }),
      );
    }
  });
});
