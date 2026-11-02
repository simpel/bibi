/** A customisation group as its pick rule reads it (ADR 0059, 0082). */
export type PickGroup = {
  name: string;
  minPick: number;
  maxPick: number;
  split: boolean;
  options: readonly { itemId: string }[];
};

/** How many of a group's options may be chosen, and how many it has. */
export type PickRule = { min: number; max: number; options: number };

/** How the rule reads: "Choose 1", "Choose 1–2", "Choose at least 1", "Choose at most 2". */
export type PickRuleKind = "EXACT" | "RANGE" | "AT_LEAST" | "AT_MOST";

/** A group whose choice breaks its rule; `field` is where the form shows it. */
export type GroupPickIssue = {
  index: number;
  group: string;
  field: "picked" | "quantities";
  count: number;
  rule: PickRule;
};

export type GroupPickIssuesInput = {
  groups: readonly PickGroup[];
  /** The chosen options of the line (a split group's only with a quantity above 0). */
  chosen: readonly { itemId: string }[];
  /**
   * Nothing chosen at all passes: `ticket.create` checks a draft line's options only when it
   * has some, `line.chooseOptions` always checks.
   */
  skipWhenNone: boolean;
};

/**
 * Core's `checkChoice` rule (`packages/core/src/features/line/option-groups.ts`) on the client:
 * each group gets between its minPick and maxPick distinct options, split groups counted by the
 * options with a quantity. Unlike core it names every broken group, not only the first.
 */
export function groupPickIssues({
  groups,
  chosen,
  skipWhenNone,
}: GroupPickIssuesInput): GroupPickIssue[] {
  if (skipWhenNone && chosen.length === 0) return [];
  const ids = new Set(chosen.map(({ itemId }) => itemId));
  return groups.flatMap((group, index) => {
    const count = group.options.filter(({ itemId }) => ids.has(itemId)).length;
    if (count >= group.minPick && count <= group.maxPick) return [];
    const rule = { min: group.minPick, max: group.maxPick, options: group.options.length };
    const field = group.split ? "quantities" : "picked";
    return [{ index, group: group.name, field, count, rule }];
  });
}

/** Which wording a rule gets: no upper bound worth naming reads "at least". */
export function pickRuleKind({ rule }: { rule: PickRule }): PickRuleKind {
  if (rule.min === rule.max) return "EXACT";
  if (rule.max >= rule.options && rule.min > 0) return "AT_LEAST";
  if (rule.min === 0) return "AT_MOST";
  return "RANGE";
}

/** A rule as localized text, e.g. "Choose 1". */
export type PickRuleText = (input: { rule: PickRule }) => string;
