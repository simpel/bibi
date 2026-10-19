import { describe, expect, it } from "vitest";
import { listMcpToolNames } from "../../../apps/mcp/src/list-mcp-tool-names";
import { LOCAL_TOOLS } from "../src/chat/local-tools";
import { resolveToolUi } from "../src/ui-contract/resolve-tool-ui";
import { GENERIC_UI_TOOLS, TOOL_UI_REGISTRY } from "../src/ui-contract/tool-ui-registry";

/** Every tool the assistant can see: MCP operation tools + generic graph tools + local tools. */
const ALL_TOOLS = [...listMcpToolNames(), "graphql_schema", "graphql_query", ...LOCAL_TOOLS];

const venue = {
  id: "v1",
  organizationId: "o1",
  name: "Aulan",
  description: null,
  streetAddress: null,
  postalCode: null,
  city: "Göteborg",
  country: "SE",
  contactEmail: null,
  contactPhone: null,
  openingHours: null,
  defaultVatRatePercent: 25,
  status: "ACTIVE",
  createdAt: "2026-10-13T10:00:00.000Z",
  updatedAt: "2026-10-13T10:00:00.000Z",
  createdBy: "u1",
};

const mcp = ({ value }: { value: unknown }) => ({ content: [], structuredContent: value });

describe("generative-UI registry parity", () => {
  it("has an entry or an explicit generic decision for every tool", () => {
    const decided = new Set([...Object.keys(TOOL_UI_REGISTRY), ...Object.keys(GENERIC_UI_TOOLS)]);
    expect(ALL_TOOLS.filter((name) => !decided.has(name))).toEqual([]);
  });

  it("has no entries for tools that do not exist and no tool in both lists", () => {
    const known = new Set(ALL_TOOLS);
    expect(
      [...Object.keys(TOOL_UI_REGISTRY), ...Object.keys(GENERIC_UI_TOOLS)].filter(
        (name) => !known.has(name),
      ),
    ).toEqual([]);
    expect(Object.keys(TOOL_UI_REGISTRY).filter((name) => name in GENERIC_UI_TOOLS)).toEqual([]);
  });
});

describe("resolveToolUi", () => {
  it("maps venue results to card/table with validated props", () => {
    expect(resolveToolUi({ toolName: "venue_get", output: mcp({ value: venue }) })).toEqual({
      component: "venue-card",
      props: { venue },
    });
    const list = resolveToolUi({
      toolName: "venue_list",
      output: mcp({ value: { items: [venue], nextCursor: null } }),
    });
    expect(list.component).toBe("venue-table");
  });

  it("shows approval proposals as approval-card regardless of tool", () => {
    const approval = {
      status: "approval_required",
      operation: "venue.create",
      input: { name: "Aulan" },
      summary: 'Create venue "Aulan"',
      approvalToken: "tok",
      expiresAt: "2026-10-13T10:10:00.000Z",
    };
    expect(
      resolveToolUi({ toolName: "venue_create", output: mcp({ value: approval }) }),
    ).toMatchObject({
      component: "approval-card",
      props: { approval: { operation: "venue.create", approvalToken: "tok" } },
    });
  });

  it("renders tool errors, invalid shapes and generic tools safely", () => {
    const error = {
      isError: true,
      content: [],
      structuredContent: { code: "FORBIDDEN", message: "No" },
    };
    expect(resolveToolUi({ toolName: "venue_get", output: error })).toEqual({
      component: "error",
      props: { code: "FORBIDDEN", message: "No" },
    });
    expect(
      resolveToolUi({ toolName: "venue_get", output: mcp({ value: { id: 1 } }) }).component,
    ).toBe("json");
    expect(
      resolveToolUi({ toolName: "graphql_query", output: mcp({ value: { data: {} } }) }).component,
    ).toBe("json");
    const skill = {
      id: "s",
      slug: "x",
      name: "X",
      version: 1,
      instructions: "do",
      activeTools: ["venue_list"],
    };
    expect(resolveToolUi({ toolName: "load_skill", output: skill }).component).toBe("skill-card");
  });
});
