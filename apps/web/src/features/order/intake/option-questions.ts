import { groupPickIssues, type PickGroup, type PickRule } from "../../line/ui/group-pick-rule";
import type { DraftLine } from "./draft-line";

/** A line whose choices break one of its item's group pick rules. */
export type OptionsQuestion = {
  kind: "OPTIONS";
  lineKey: string;
  name: string;
  group: string;
  count: number;
  rule: PickRule;
};

/** A required group of a line with nothing chosen yet (ADR 0089), until decided later. */
export type OpenChoiceQuestion = {
  kind: "OPEN_CHOICE";
  lineKey: string;
  name: string;
  group: string;
  rule: PickRule;
};

/** An item's groups as the open questions read them (the catalog's). */
export type ItemGroups = { id: string; groups: readonly PickGroup[] };

export type OptionQuestionsInput = { line: DraftLine; items: readonly ItemGroups[] };

/**
 * One question per group the line's options break, by core's rule as `order.create` checks it
 * (`groupPickIssues`, only once the line chose something). Answered by editing the line.
 */
export function optionQuestions({ line, items }: OptionQuestionsInput): OptionsQuestion[] {
  const groups = items.find(({ id }) => id === line.itemId)?.groups ?? [];
  if (groups.length === 0) return [];
  return groupPickIssues({ groups, chosen: line.options }).map(({ group, count, rule }) => ({
    ...{ kind: "OPTIONS", lineKey: line.key, name: line.name },
    ...{ group, count, rule },
  }));
}

/** What `accepted` holds once a required group was left for later (ADR 0089). */
export const decidedLaterKey = ({ lineKey, group }: { lineKey: string; group: string }) =>
  `CHOICE:${lineKey}:${group}`;

export type OpenChoiceQuestionsInput = OptionQuestionsInput & { accepted: readonly string[] };

/**
 * One question per required group (minPick 1 or more) of the line's item with nothing chosen
 * (ADR 0089), unless it was left for later. Answered by Decide later or by editing the line;
 * the order can be created with the group open (its line then warns UNCHOSEN_REQUIRED_GROUP).
 */
export function openChoiceQuestions({
  line,
  items,
  accepted,
}: OpenChoiceQuestionsInput): OpenChoiceQuestion[] {
  const groups = items.find(({ id }) => id === line.itemId)?.groups ?? [];
  const chosen = new Set(line.options.map(({ itemId }) => itemId));
  return groups
    .filter((group) => group.minPick >= 1)
    .filter((group) => !group.options.some(({ itemId }) => chosen.has(itemId)))
    .filter(
      (group) => !accepted.includes(decidedLaterKey({ lineKey: line.key, group: group.name })),
    )
    .map((group) => ({
      ...{ kind: "OPEN_CHOICE", lineKey: line.key, name: line.name, group: group.name },
      rule: { min: group.minPick, max: group.maxPick, options: group.options.length },
    }));
}
