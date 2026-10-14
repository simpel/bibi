import { describe, expect, it } from "vitest";
import { extractPendingApprovals } from "../src/approval/extract-pending-approvals";
import { createToolRestriction } from "../src/skills/tool-restriction";

const proposal = {
  status: "approval_required",
  operation: "item.create",
  input: { venueId: "v1", name: "Rum 1" },
  summary: 'Create item "Rum 1"',
  approvalToken: "token-1",
  expiresAt: "2026-10-13T10:10:00.000Z",
};

describe("extractPendingApprovals", () => {
  it("finds approval_required results in MCP (dynamic) and local tool parts", () => {
    const parts = [
      { type: "text", text: "Jag föreslår:" },
      {
        type: "dynamic-tool",
        toolName: "item_create",
        toolCallId: "c1",
        state: "output-available",
        input: {},
        output: { content: [], structuredContent: proposal },
      },
      {
        type: "tool-item_create",
        toolCallId: "c2",
        state: "output-available",
        input: {},
        output: proposal,
      },
      {
        type: "dynamic-tool",
        toolName: "venue_list",
        toolCallId: "c3",
        state: "output-available",
        input: {},
        output: { structuredContent: { items: [] } },
      },
      {
        type: "dynamic-tool",
        toolName: "item_create",
        toolCallId: "c4",
        state: "input-available",
        input: {},
      },
    ];
    const approvals = extractPendingApprovals({ message: { parts } });
    expect(approvals.map((approval) => [approval.toolCallId, approval.toolName])).toEqual([
      ["c1", "item_create"],
      ["c2", "item_create"],
    ]);
    expect(approvals[0]).toMatchObject({
      operation: "item.create",
      approvalToken: "token-1",
      summary: 'Create item "Rum 1"',
    });
  });

  it("ignores malformed proposals", () => {
    const bad = { ...proposal, approvalToken: "" };
    const parts = [
      {
        type: "dynamic-tool",
        toolName: "x",
        toolCallId: "c",
        state: "output-available",
        output: bad,
      },
    ];
    expect(extractPendingApprovals({ message: { parts } })).toEqual([]);
  });
});

describe("tool restriction (load_skill)", () => {
  const available = ["venue_list", "venue_create", "search", "skill_search", "load_skill"];
  const alwaysAllowed = ["skill_search", "load_skill"];

  it("only narrows: intersection with available tools and earlier restrictions", () => {
    const restriction = createToolRestriction({ available, alwaysAllowed });
    expect(restriction.active()).toBeNull();
    restriction.activate({ allowedTools: ["venue_list", "search", "secret_admin_tool"] });
    expect(restriction.active()?.slice().sort()).toEqual([
      "load_skill",
      "search",
      "skill_search",
      "venue_list",
    ]);
    restriction.activate({ allowedTools: ["venue_create", "search"] });
    expect(restriction.isAllowed({ name: "search" })).toBe(true);
    expect(restriction.isAllowed({ name: "venue_create" })).toBe(false);
    expect(restriction.isAllowed({ name: "venue_list" })).toBe(false);
    expect(restriction.isAllowed({ name: "load_skill" })).toBe(true);
  });

  it("treats an empty allowedTools list as no additional restriction", () => {
    const restriction = createToolRestriction({ available, alwaysAllowed });
    restriction.activate({ allowedTools: [] });
    expect(restriction.active()).toBeNull();
  });
});
