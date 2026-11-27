import { describe, expect, it } from "vitest";
import { buildGraph, parseConnection } from "./build-graph";
import type { MappingAccount, MappingPurpose } from "./mapping-types";

const accounts: MappingAccount[] = [
  { id: "a1", label: "3001" },
  { id: "a2", label: "3041" },
  { id: "a3", label: "3051" },
];
const purposes: MappingPurpose[] = [
  { id: "p1", label: "Rooms", accountId: "a2", state: "ok" },
  { id: "p2", label: "Food", accountId: "a2", state: "attention" },
  { id: "p3", label: "Other", accountId: null, state: "unmapped" },
];

describe("buildGraph", () => {
  it("shows only mapped or pinned accounts, in account order", () => {
    const graph = buildGraph({ purposes, accounts, pinned: new Set(["a1"]) });
    expect(graph.visibleAccounts.map((account) => account.id)).toEqual(["a1", "a2"]);
    expect(graph.edges.map((edge) => edge.id)).toEqual(["e:p1", "e:p2"]);
  });

  it("gives an account the worst state of its purposes", () => {
    const graph = buildGraph({ purposes, accounts, pinned: new Set() });
    const node = graph.nodes.find((candidate) => candidate.id === "a:a2");
    expect(node?.type === "account" && node.data.state).toBe("attention");
  });

  it("grows with the rows but never below the minimum", () => {
    expect(buildGraph({ purposes: [], accounts, pinned: new Set() }).height).toBe(280);
    const many = Array.from({ length: 10 }, (_, index) => ({
      id: `p${index}`,
      label: "x",
      accountId: null,
      state: "unmapped" as const,
    }));
    expect(buildGraph({ purposes: many, accounts, pinned: new Set() }).height).toBeGreaterThan(280);
  });

  it("only accepts purpose to account connections", () => {
    expect(parseConnection({ source: "p:p1", target: "a:a2" })).toEqual({
      purposeId: "p1",
      accountId: "a2",
    });
    expect(parseConnection({ source: "a:a2", target: "p:p1" })).toBeNull();
  });
});
