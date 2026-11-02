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
    });
    expect(issues).toEqual([
      { index: 0, group: "Snack", field: "picked", count: 3, rule: { min: 1, max: 1, options: 3 } },
    ]);
  });

  it("accepts a count inside the range and names every broken group", () => {
    const drink = { name: "Drink", minPick: 2, maxPick: 3, split: true };
    const groups = [group(), group({ ...drink, options: [{ itemId: "tea" }, { itemId: "milk" }] })];
    const ok = groupPickIssues({ groups, chosen: chosen({ ids: ["cake", "tea", "milk"] }) });
    expect(ok).toEqual([]);
    const picked = chosen({ ids: ["cake", "fruit", "tea"] });
    const issues = groupPickIssues({ groups, chosen: picked });
    expect(issues.map(({ index, field }) => [index, field])).toEqual([
      [0, "picked"],
      [1, "quantities"],
    ]);
  });

  it("leaves a group with no pick open, even a required one (ADR 0089)", () => {
    expect(groupPickIssues({ groups: [group()], chosen: [] })).toEqual([]);
    const optional = group({ minPick: 0 });
    expect(groupPickIssues({ groups: [optional], chosen: [] })).toEqual([]);
  });

  it("counts only the group's own options", () => {
    const issues = groupPickIssues({
      groups: [group(), group({ name: "Other", options: [{ itemId: "tea" }] })],
      chosen: chosen({ ids: ["cake", "tea"] }),
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
