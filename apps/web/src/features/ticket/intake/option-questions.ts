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

/** An item's groups as the open questions read them (the catalog's). */
export type ItemGroups = { id: string; groups: readonly PickGroup[] };

export type OptionQuestionsInput = { line: DraftLine; items: readonly ItemGroups[] };

/**
 * One question per group the line's options break, by core's rule as `ticket.create` checks it
 * (`groupPickIssues`, only once the line chose something). Answered by editing the line.
 */
export function optionQuestions({ line, items }: OptionQuestionsInput): OptionsQuestion[] {
  const groups = items.find(({ id }) => id === line.itemId)?.groups ?? [];
  if (groups.length === 0) return [];
  return groupPickIssues({ groups, chosen: line.options, skipWhenNone: true }).map(
    ({ group, count, rule }) => ({
      ...{ kind: "OPTIONS", lineKey: line.key, name: line.name },
      ...{ group, count, rule },
    }),
  );
}
