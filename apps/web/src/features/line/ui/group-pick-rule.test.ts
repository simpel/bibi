import { describe, expect, it } from "vitest";
import { groupPickIssues, type PickGroup, pickRuleKind } from "./group-pick-rule";

const group = ({ ...patch }: Partial<PickGroup> = {}): PickGroup => ({
  ...{ name: "Snack", minPick: 1, maxPick: 1, split: false },
  options: [{ itemId: "cake" }, { itemId: "fruit" }, { itemId: "oat" }],
  ...patch,
});

const chosen = ({ ids }: { ids: string[] }) => ids.map((itemId) => ({ itemId }));

describe("groupPickIssues", () => {
  it("refuses more than a group's maxPick, at the group's picked field", () => {
    const issues = groupPickIssues({
      groups: [group()],
      chosen: chosen({ ids: ["cake", "fruit", "oat"] }),
      skipWhenNone: true,
    });
    expect(issues).toEqual([
      { index: 0, group: "Snack", field: "picked", count: 3, rule: { min: 1, max: 1, options: 3 } },
    ]);
  });

  it("accepts a count inside the range and names every broken group", () => {
    const groups = [group(), group({ name: "Drink", minPick: 2, maxPick: 3, split: true })];
    const ok = groupPickIssues({ groups, chosen: [], skipWhenNone: true });
    expect(ok).toEqual([]);
    const issues = groupPickIssues({ groups, chosen: chosen({ ids: ["x"] }), skipWhenNone: false });
    expect(issues.map(({ index, field }) => [index, field])).toEqual([
      [0, "picked"],
      [1, "quantities"],
    ]);
  });

  it("checks nothing chosen only when asked to (line.chooseOptions)", () => {
    expect(groupPickIssues({ groups: [group()], chosen: [], skipWhenNone: true })).toEqual([]);
    expect(groupPickIssues({ groups: [group()], chosen: [], skipWhenNone: false })).toHaveLength(1);
    const optional = group({ minPick: 0 });
    expect(groupPickIssues({ groups: [optional], chosen: [], skipWhenNone: false })).toEqual([]);
  });

  it("counts only the group's own options", () => {
    const issues = groupPickIssues({
      groups: [group(), group({ name: "Other", options: [{ itemId: "tea" }] })],
      chosen: chosen({ ids: ["cake", "tea"] }),
      skipWhenNone: true,
    });
    expect(issues).toEqual([]);
  });
});

describe("pickRuleKind", () => {
  it("reads exact, at least, at most and a range", () => {
    expect(pickRuleKind({ rule: { min: 1, max: 1, options: 3 } })).toBe("EXACT");
    expect(pickRuleKind({ rule: { min: 1, max: 3, options: 3 } })).toBe("AT_LEAST");
    expect(pickRuleKind({ rule: { min: 0, max: 2, options: 3 } })).toBe("AT_MOST");
    expect(pickRuleKind({ rule: { min: 1, max: 2, options: 3 } })).toBe("RANGE");
  });
});
